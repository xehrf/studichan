import express from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initDb, query, withTransaction } from './db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 3000)
const isProduction = process.env.NODE_ENV === 'production'
const googleClient = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
  : null
const oauthStates = new Map()

await initDb()

app.use(express.json({ limit: '5mb' }))
app.use(express.static(path.join(__dirname, 'dist')))

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
const developmentOnly = (_req, res, next) => {
  if (isProduction) return res.status(404).json({ error: 'Not found' })
  next()
}

const cookieValue = (req, name) => req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1)
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')
const publicUser = (user) => ({ id: user.id, email: user.email, full_name: user.full_name })
const createSession = async (userId, res) => {
  const token = crypto.randomBytes(32).toString('hex')
  await query('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')', [hashToken(token), userId])
  res.setHeader('Set-Cookie', `studichan_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000${isProduction ? '; Secure' : ''}`)
}
const currentUser = async (req) => {
  const token = cookieValue(req, 'studichan_session')
  if (!token) return null
  const result = await query(`SELECT u.id, u.email, u.full_name FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW()`, [hashToken(token)])
  return result.rows[0] || null
}

app.get('/api/auth/google', (req, res) => {
  if (!googleClient || !process.env.GOOGLE_REDIRECT_URI) return res.status(503).send('Google authentication is not configured')
  const state = crypto.randomBytes(24).toString('hex')
  oauthStates.set(state, Date.now() + 10 * 60 * 1000)
  const authUrl = googleClient.generateAuthUrl({ access_type: 'online', scope: ['openid', 'email', 'profile'], state, prompt: 'select_account' })
  res.redirect(authUrl)
})

app.get('/api/auth/google/callback', asyncRoute(async (req, res) => {
  const { code, state } = req.query
  const expiresAt = oauthStates.get(state)
  oauthStates.delete(state)
  if (!code || !state || !expiresAt || expiresAt < Date.now()) return res.status(400).send('Invalid Google authentication state')
  if (!googleClient) return res.status(503).send('Google authentication is not configured')

  const { tokens } = await googleClient.getToken(code)
  const ticket = await googleClient.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID })
  const profile = ticket.getPayload()
  if (!profile?.sub || !profile.email || profile.email_verified !== true) return res.status(400).send('Google account email is not verified')

  const result = await query(`
    INSERT INTO users (email, google_id, full_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO UPDATE SET google_id = COALESCE(users.google_id, EXCLUDED.google_id), full_name = COALESCE(NULLIF(users.full_name, ''), EXCLUDED.full_name)
    RETURNING id, email, full_name
  `, [profile.email.toLowerCase(), profile.sub, profile.name || ''])
  await createSession(result.rows[0].id, res)
  res.redirect('/')
}))

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
      , data_status, data_checked_at, city_safety, city_safety_description
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
    name, city, city_safety, region, ranking, specialties, requirements, tuition, description, website, source_url, verified_at, city_safety_description
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
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
    verified_at = EXCLUDED.verified_at,
    city_safety = EXCLUDED.city_safety,
    city_safety_description = EXCLUDED.city_safety_description
  RETURNING id
`

app.post('/api/admin/universities', developmentOnly, asyncRoute(async (req, res) => {
  const {
    name, city, city_safety, region, ranking, specialties, requirements, tuition,
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
        name, city, city_safety, region, ranking, specialties, requirements, tuition,
        description, website, source_url, verified_at, name_translations,
        description_translations, specialties_translations, requirements_translations,
        tuition_translations, image_url, image_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      universityName, universityCity, ['low', 'medium', 'high', 'not_rated'].includes(city_safety) ? city_safety : 'not_rated', universityRegion, parsedRanking,
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
        name: get(row, 'name'), city: get(row, 'city'), region: get(row, 'region'), citySafety: get(row, 'city_safety') || 'not_rated',
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
        university.name, university.city, university.citySafety, university.region, university.ranking, university.specialties,
        university.requirements, university.tuition, university.description, university.website,
        university.sourceUrl, university.verifiedAt, university.citySafetyDescription || '',
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
    await createSession(result.rows[0].id, res)
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
  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  await createSession(user.id, res)
  res.json({ ok: true, user: publicUser(user) })
}))

app.get('/api/auth/me', asyncRoute(async (req, res) => {
  const user = await currentUser(req)
  res.json({ user: user ? publicUser(user) : null })
}))

app.post('/api/auth/logout', asyncRoute(async (req, res) => {
  const token = cookieValue(req, 'studichan_session')
  if (token) await query('DELETE FROM auth_sessions WHERE token_hash = $1', [hashToken(token)])
  res.setHeader('Set-Cookie', 'studichan_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0')
  res.json({ ok: true })
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
