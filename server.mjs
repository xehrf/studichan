import express from 'express'
import bcrypt from 'bcryptjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initDb, query, withTransaction } from './db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 3000)
const isProduction = process.env.NODE_ENV === 'production'

await initDb()

app.use(express.json({ limit: '5mb' }))
app.use(express.static(path.join(__dirname, 'dist')))

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
const developmentOnly = (_req, res, next) => {
  if (isProduction) return res.status(404).json({ error: 'Not found' })
  next()
}

// Проверка состояния приложения и подключения к PostgreSQL.
app.get('/api/health', asyncRoute(async (_req, res) => {
  await query('SELECT 1')
  res.json({ ok: true, db: 'connected' })
}))

// Получить все университеты (с фильтром).
app.get('/api/universities', asyncRoute(async (req, res) => {
  const { region, specialty, search } = req.query
  const conditions = []
  const params = []
  const addParam = (value) => {
    params.push(value)
    return `$${params.length}`
  }

  if (region) conditions.push(`region = ${addParam(region)}`)
  if (specialty) conditions.push(`specialties ILIKE ${addParam(`%${specialty}%`)}`)
  if (search) {
    const term = addParam(`%${search}%`)
    conditions.push(`(name ILIKE ${term} OR city ILIKE ${term})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await query(`
    SELECT id, name, city, region, ranking, specialties, requirements, tuition, description,
      name_translations, description_translations, specialties_translations, requirements_translations,
      tuition_translations, image_url, image_source, website, source_url, verified_at, agency_id, students_count
    FROM universities
    ${where}
    ORDER BY ranking ASC NULLS LAST, name ASC
  `, params)
  res.json(result.rows)
}))

// Получить один университет.
app.get('/api/universities/:id', asyncRoute(async (req, res) => {
  const universityResult = await query('SELECT * FROM universities WHERE id = $1', [req.params.id])
  const university = universityResult.rows[0]
  if (!university) return res.status(404).json({ error: 'University not found' })

  let agency = null
  if (university.agency_id) {
    const agencyResult = await query('SELECT * FROM agencies WHERE id = $1', [university.agency_id])
    agency = agencyResult.rows[0] || null
  }
  res.json({ ...university, agency })
}))

const parseCsv = (csv) => {
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i]
    if (char === '"') {
      if (quoted && csv[i + 1] === '"') { value += '"'; i += 1 } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(value.trim()); value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && csv[i + 1] === '\n') i += 1
      row.push(value.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []; value = ''
    } else value += char
  }
  row.push(value.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

const universityUpsertSql = `
  INSERT INTO universities (
    name, city, region, ranking, specialties, requirements, tuition, description, website, source_url, verified_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
  )
  ON CONFLICT (name) DO UPDATE SET
    city = EXCLUDED.city,
    region = EXCLUDED.region,
    ranking = EXCLUDED.ranking,
    specialties = EXCLUDED.specialties,
    requirements = EXCLUDED.requirements,
    tuition = EXCLUDED.tuition,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    source_url = EXCLUDED.source_url,
    verified_at = EXCLUDED.verified_at
  RETURNING id
`

app.post('/api/admin/universities', developmentOnly, asyncRoute(async (req, res) => {
  const {
    name, city, region, ranking, specialties, requirements, tuition,
    description, website, sourceUrl, verifiedAt,
    nameTranslations, descriptionTranslations, specialtiesTranslations,
    requirementsTranslations, tuitionTranslations, imageUrl, imageSource,
  } = req.body

  const universityName = String(name || '').trim()
  const universityCity = String(city || '').trim()
  const universityRegion = String(region || '').trim()
  if (!universityName || !universityCity || !universityRegion) {
    return res.status(400).json({ error: 'name, city and region are required' })
  }

  const parsedRanking = ranking === undefined || ranking === '' ? null : Number(ranking)
  if (parsedRanking !== null && !Number.isInteger(parsedRanking)) {
    return res.status(400).json({ error: 'ranking must be an integer' })
  }

  try {
    const result = await query(`
      INSERT INTO universities (
        name, city, region, ranking, specialties, requirements, tuition,
        description, website, source_url, verified_at, name_translations,
        description_translations, specialties_translations, requirements_translations,
        tuition_translations, image_url, image_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      universityName, universityCity, universityRegion, parsedRanking,
      specialties || '', requirements || '', tuition || '', description || '',
      website || '', sourceUrl || '', verifiedAt || new Date().toISOString().slice(0, 10),
      nameTranslations || {}, descriptionTranslations || {}, specialtiesTranslations || {},
      requirementsTranslations || {}, tuitionTranslations || {}, imageUrl || null, imageSource || null,
    ])
    res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'University already exists' })
    throw error
  }
}))

// Удобный импорт в локальной разработке. В production используйте CLI-скрипт,
// чтобы публичный сайт не получил открытый административный маршрут.
app.post('/api/admin/import-universities', developmentOnly, asyncRoute(async (req, res) => {
  const { csv } = req.body
  if (!csv || typeof csv !== 'string') return res.status(400).json({ error: 'CSV is required' })

  const rows = parseCsv(csv.replace(/^\uFEFF/, ''))
  if (rows.length < 2) return res.status(400).json({ error: 'Add a header and at least one university' })
  const headers = rows[0].map((header) => header.toLowerCase().trim())
  const index = (name) => headers.indexOf(name)
  const get = (row, name) => {
    const position = index(name)
    return position >= 0 ? (row[position] || '').trim() : ''
  }
  if (index('name') < 0 || index('city') < 0 || index('region') < 0) {
    return res.status(400).json({ error: 'Required columns: name, city, region' })
  }

  const outcome = await withTransaction(async (client) => {
    let imported = 0
    const skipped = []
    for (const [offset, row] of rows.slice(1).entries()) {
      const university = {
        name: get(row, 'name'), city: get(row, 'city'), region: get(row, 'region'),
        ranking: Number(get(row, 'ranking')) || null, specialties: get(row, 'specialties'),
        requirements: get(row, 'requirements'), tuition: get(row, 'tuition'), description: get(row, 'description'),
        website: get(row, 'website'), sourceUrl: get(row, 'source_url'),
        verifiedAt: get(row, 'verified_at') || new Date().toISOString().slice(0, 10),
      }
      if (!university.name || !university.city || !university.region) {
        skipped.push(offset + 2)
        continue
      }
      await client.query(universityUpsertSql, [
        university.name, university.city, university.region, university.ranking, university.specialties,
        university.requirements, university.tuition, university.description, university.website,
        university.sourceUrl, university.verifiedAt,
      ])
      imported += 1
    }
    return { imported, skipped }
  })
  res.json({ ok: true, ...outcome })
}))

// Регистрация пользователя. Пароли в базе хранятся только как bcrypt-хеши.
app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { email, password, fullName, country, phone } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters' })

  const passwordHash = await bcrypt.hash(password, 12)
  try {
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, country, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name',
      [String(email).trim().toLowerCase(), passwordHash, fullName || '', country || '', phone || ''],
    )
    res.status(201).json({ ok: true, user: result.rows[0] })
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Email already registered' })
    throw error
  }
}))

// Вход. Полноценные сессии/роли можно добавить следующим этапом.
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const result = await query('SELECT id, email, full_name, password_hash FROM users WHERE email = $1', [String(email).trim().toLowerCase()])
  const user = result.rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  res.json({ ok: true, user: { id: user.id, email: user.email, full_name: user.full_name } })
}))

// Подать заявку на университет.
app.post('/api/applications', asyncRoute(async (req, res) => {
  const { userId, universityId } = req.body
  if (!userId || !universityId) return res.status(400).json({ error: 'User and university IDs required' })

  try {
    const result = await query(
      'INSERT INTO applications (user_id, university_id) VALUES ($1, $2) ON CONFLICT (user_id, university_id) DO NOTHING RETURNING id',
      [userId, universityId],
    )
    if (!result.rows[0]) return res.status(409).json({ error: 'Application already exists' })
    res.status(201).json({ ok: true, applicationId: result.rows[0].id })
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'User or university not found' })
    throw error
  }
}))

// SPA fallback.
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Studichan is running on port ${port}`)
})
