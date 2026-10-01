import express from 'express'
import compression from 'compression'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initDb, query, withTransaction } from './db.mjs'
import { GROUPS, SPECIALTIES } from './src/catalog-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 3000)
const isProduction = process.env.NODE_ENV === 'production'
// Secure-cookie принимается браузером только по HTTPS. Пока у сервера нет
// домена и сертификата, задайте COOKIE_SECURE=false, иначе вход не заработает.
const secureCookies = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction
const googleClient = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
  : null
const oauthStates = new Map()

await initDb()

app.use(compression())
app.use(express.json({ limit: '5mb' }))
// Файлы сборки содержат хеш в имени, их можно кешировать надолго.
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), { immutable: true, maxAge: '1y' }))
app.use(express.static(path.join(__dirname, 'dist')))

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
const developmentOnly = (_req, res, next) => {
  if (isProduction) return res.status(404).json({ error: 'Not found' })
  next()
}

const cookieValue = (req, name) => req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1)
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')
// Доступ к /admin: email через запятую в ADMIN_EMAILS (в .env на сервере).
const adminEmails = new Set(String(process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean))
const isAdmin = (user) => Boolean(user && adminEmails.has(String(user.email).toLowerCase()))
const publicUser = (user) => ({ id: user.id, email: user.email, full_name: user.full_name, is_admin: isAdmin(user) })
const createSession = async (userId, res) => {
  const token = crypto.randomBytes(32).toString('hex')
  await query('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')', [hashToken(token), userId])
  res.setHeader('Set-Cookie', `studichan_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000${secureCookies ? '; Secure' : ''}`)
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

// Поля для карточек каталога. Список отдаётся целиком: фильтры и сортировка
// работают в браузере, чтобы переключение не ждало сервер.
// Вузы, добавленные старым CSV-импортом, могут быть без slug: тогда ссылка
// строится по id (/u/123), а маршрут ниже понимает оба варианта.
const listColumns = `
  id, COALESCE(slug, id::text) AS slug, name, country, city, city_translations, region, ranking, ranking_world, ranking_world_label,
  university_type, specialties, admission_requirements, tuition_currency, tuition_min_local, tuition_max_local,
  tuition_min_kzt, tuition_max_kzt, name_translations, name_local, image_url, website,
  jsonb_array_length(image_gallery) AS photo_count, agency_id, city_safety, scholarships, languages,
  founded, students_count
`

// Получить все университеты (с необязательным фильтром).
app.get('/api/universities', asyncRoute(async (req, res) => {
  const { country, region, specialty, search } = req.query
  const conditions = []
  const params = []
  const addParam = (value) => {
    params.push(value)
    return `$${params.length}`
  }

  if (country) conditions.push(`country = ${addParam(String(country).toUpperCase())}`)
  if (region) conditions.push(`region = ${addParam(region)}`)
  if (specialty) conditions.push(`specialties ILIKE ${addParam(`%${specialty}%`)}`)
  if (search) {
    const term = addParam(`%${search}%`)
    conditions.push(`(name ILIKE ${term} OR city ILIKE ${term} OR name_translations::text ILIKE ${term} OR city_translations::text ILIKE ${term})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await query(`
    SELECT ${listColumns}
    FROM universities
    ${where}
    ORDER BY ranking_world ASC NULLS LAST, ranking ASC NULLS LAST, name ASC
  `, params)
  res.set('Cache-Control', 'public, max-age=300')
  res.json(result.rows)
}))

// Получить один университет по slug (/api/universities/mit) или числовому id.
app.get('/api/universities/:key', asyncRoute(async (req, res) => {
  const key = String(req.params.key)
  const universityResult = /^\d+$/.test(key)
    ? await query('SELECT * FROM universities WHERE id = $1', [key])
    : await query('SELECT * FROM universities WHERE slug = $1', [key])
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
  res.json({ user: user ? publicUser(user) : null, googleEnabled: Boolean(googleClient && process.env.GOOGLE_REDIRECT_URI) })
}))

app.post('/api/auth/logout', asyncRoute(async (req, res) => {
  const token = cookieValue(req, 'studichan_session')
  if (token) await query('DELETE FROM auth_sessions WHERE token_hash = $1', [hashToken(token)])
  res.setHeader('Set-Cookie', 'studichan_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0')
  res.json({ ok: true })
}))

// Подать заявку на университет. Пользователь берётся из сессии, а не из тела
// запроса, иначе можно было бы отправить заявку от чужого имени.
app.post('/api/applications', asyncRoute(async (req, res) => {
  const user = await currentUser(req)
  if (!user) return res.status(401).json({ error: 'Sign in to apply' })
  const universityId = Number(req.body.universityId)
  if (!Number.isInteger(universityId)) return res.status(400).json({ error: 'University ID required' })

  try {
    const result = await query(
      'INSERT INTO applications (user_id, university_id) VALUES ($1, $2) ON CONFLICT (user_id, university_id) DO NOTHING RETURNING id',
      [user.id, universityId],
    )
    if (!result.rows[0]) return res.status(409).json({ error: 'Application already exists' })
    res.status(201).json({ ok: true, applicationId: result.rows[0].id })
    notifyNewApplication(user, universityId).catch(error => console.error('Telegram notification failed:', error.message))
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'University not found' })
    throw error
  }
}))

// Заявки текущего пользователя: чтобы показать «заявка отправлена» на карточке.
app.get('/api/applications', asyncRoute(async (req, res) => {
  const user = await currentUser(req)
  if (!user) return res.json({ applications: [] })
  const result = await query('SELECT university_id, status, created_at FROM applications WHERE user_id = $1 ORDER BY created_at DESC', [user.id])
  res.json({ applications: result.rows })
}))

// ---------- Личный кабинет ----------

const requireUser = asyncRoute(async (req, res, next) => {
  const user = await currentUser(req)
  if (!user) return res.status(401).json({ error: 'Sign in required' })
  req.user = user
  next()
})

const requireAdmin = asyncRoute(async (req, res, next) => {
  const user = await currentUser(req)
  if (!isAdmin(user)) return res.status(user ? 403 : 401).json({ error: 'Admin only' })
  req.user = user
  next()
})

const STUDY_LEVELS = ['bachelor', 'master', 'language', 'foundation']
const TEST_TYPES = ['career', 'ielts']
const APPLICATION_STATUSES = ['pending', 'contacted', 'in_progress', 'enrolled', 'rejected']

const intOrNull = (value, min, max) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isInteger(number) && number >= min && number <= max ? number : undefined
}

// Возвращает нормализованный профиль или строку с ошибкой.
const parseProfile = (body) => {
  const phone = String(body.phone || '').trim()
  if (phone && !/^[+\d\s()-]{7,25}$/.test(phone)) return 'Invalid phone'
  const city = String(body.city || '').trim().slice(0, 80)
  const graduationYear = intOrNull(body.graduation_year, 2015, 2040)
  const budget = intOrNull(body.budget, 0, 200000000)
  const untScore = intOrNull(body.unt_score, 0, 140)
  if ([graduationYear, budget, untScore].includes(undefined)) return 'Invalid number'
  let ieltsScore = null
  if (body.ielts_score !== null && body.ielts_score !== undefined && body.ielts_score !== '') {
    ieltsScore = Number(body.ielts_score)
    if (!(ieltsScore >= 0 && ieltsScore <= 9 && Number.isInteger(ieltsScore * 2))) return 'Invalid IELTS score'
  }
  const studyLevel = STUDY_LEVELS.includes(body.study_level) ? body.study_level : null
  const pick = (values, allowed) => [...new Set((Array.isArray(values) ? values : []).filter(value => allowed.includes(value)))]
  return {
    phone: phone || null, city: city || null, graduationYear, studyLevel, budget, untScore, ieltsScore,
    targetGroups: pick(body.target_groups, GROUPS), specialties: pick(body.specialties, SPECIALTIES),
    contactConsent: body.contact_consent === true,
  }
}

const cabinetData = async (userId) => {
  const [profile, favorites, applications, results] = await Promise.all([
    query('SELECT phone, city, graduation_year, study_level, target_groups, specialties, budget, unt_score, ielts_score, contact_consent, consent_at FROM user_profiles WHERE user_id = $1', [userId]),
    query('SELECT COALESCE(u.slug, u.id::text) AS slug FROM user_favorites f JOIN universities u ON u.id = f.university_id WHERE f.user_id = $1 ORDER BY f.created_at', [userId]),
    query('SELECT a.university_id, COALESCE(u.slug, u.id::text) AS slug, a.status, a.created_at FROM applications a JOIN universities u ON u.id = a.university_id WHERE a.user_id = $1 ORDER BY a.created_at DESC', [userId]),
    query(`SELECT test_type, result, created_at FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY test_type ORDER BY created_at DESC) AS position FROM test_results WHERE user_id = $1
    ) ranked WHERE position <= 10 ORDER BY created_at DESC`, [userId]),
  ])
  const profileRow = profile.rows[0] || null
  if (profileRow?.ielts_score !== null && profileRow?.ielts_score !== undefined) profileRow.ielts_score = Number(profileRow.ielts_score)
  return {
    profile: profileRow,
    favorites: favorites.rows.map(row => row.slug),
    applications: applications.rows,
    results: {
      career: results.rows.find(row => row.test_type === 'career') || null,
      ielts: results.rows.filter(row => row.test_type === 'ielts'),
    },
  }
}

app.get('/api/cabinet', requireUser, asyncRoute(async (req, res) => {
  res.json(await cabinetData(req.user.id))
}))

app.put('/api/profile', requireUser, asyncRoute(async (req, res) => {
  const profile = parseProfile(req.body || {})
  if (typeof profile === 'string') return res.status(400).json({ error: profile })
  if (req.body.full_name !== undefined) {
    await query('UPDATE users SET full_name = $1 WHERE id = $2', [String(req.body.full_name).trim().slice(0, 120), req.user.id])
  }
  await query(`
    INSERT INTO user_profiles (user_id, phone, city, graduation_year, study_level, target_groups, specialties, budget,
      unt_score, ielts_score, contact_consent, consent_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CASE WHEN $11 THEN NOW() END, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      phone = EXCLUDED.phone, city = EXCLUDED.city, graduation_year = EXCLUDED.graduation_year,
      study_level = EXCLUDED.study_level, target_groups = EXCLUDED.target_groups, specialties = EXCLUDED.specialties,
      budget = EXCLUDED.budget, unt_score = EXCLUDED.unt_score, ielts_score = EXCLUDED.ielts_score,
      contact_consent = EXCLUDED.contact_consent,
      -- Дата согласия фиксируется в момент, когда его дали, и сбрасывается при отзыве.
      consent_at = CASE WHEN NOT EXCLUDED.contact_consent THEN NULL ELSE COALESCE(user_profiles.consent_at, NOW()) END,
      updated_at = NOW()
  `, [req.user.id, profile.phone, profile.city, profile.graduationYear, profile.studyLevel, JSON.stringify(profile.targetGroups),
    JSON.stringify(profile.specialties), profile.budget, profile.untScore, profile.ieltsScore, profile.contactConsent])
  res.json(await cabinetData(req.user.id))
}))

const universityIdBySlug = async (slug) => (await query('SELECT id FROM universities WHERE COALESCE(slug, id::text) = $1', [String(slug)])).rows[0]?.id

app.put('/api/favorites/:slug', requireUser, asyncRoute(async (req, res) => {
  const universityId = await universityIdBySlug(req.params.slug)
  if (!universityId) return res.status(404).json({ error: 'University not found' })
  await query('INSERT INTO user_favorites (user_id, university_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, universityId])
  res.json({ ok: true })
}))

app.delete('/api/favorites/:slug', requireUser, asyncRoute(async (req, res) => {
  const universityId = await universityIdBySlug(req.params.slug)
  if (universityId) await query('DELETE FROM user_favorites WHERE user_id = $1 AND university_id = $2', [req.user.id, universityId])
  res.json({ ok: true })
}))

// После входа избранное из браузера переносится в аккаунт.
app.post('/api/favorites/merge', requireUser, asyncRoute(async (req, res) => {
  const slugs = (Array.isArray(req.body.slugs) ? req.body.slugs : []).map(String).slice(0, 300)
  if (slugs.length) {
    await query(`
      INSERT INTO user_favorites (user_id, university_id)
      SELECT $1, id FROM universities WHERE COALESCE(slug, id::text) = ANY($2::text[])
      ON CONFLICT DO NOTHING
    `, [req.user.id, slugs])
  }
  res.json(await cabinetData(req.user.id))
}))

app.post('/api/tests/results', requireUser, asyncRoute(async (req, res) => {
  const { type, result } = req.body || {}
  if (!TEST_TYPES.includes(type) || !result || typeof result !== 'object') return res.status(400).json({ error: 'Invalid test result' })
  const json = JSON.stringify(result)
  if (json.length > 8000) return res.status(413).json({ error: 'Result is too large' })
  const saved = await query('INSERT INTO test_results (user_id, test_type, result) VALUES ($1, $2, $3) RETURNING id, created_at', [req.user.id, type, json])
  res.status(201).json(saved.rows[0])
}))

// ---------- Админка: заявки и профили абитуриентов ----------

const leadsQuery = `
  SELECT u.id AS user_id, u.email, u.full_name, u.created_at AS registered_at,
    p.phone, p.city, p.graduation_year, p.study_level, p.target_groups, p.specialties, p.budget, p.unt_score,
    p.ielts_score, p.contact_consent, p.consent_at, p.updated_at,
    (SELECT result FROM test_results t WHERE t.user_id = u.id AND t.test_type = 'career' ORDER BY created_at DESC LIMIT 1) AS career,
    (SELECT result FROM test_results t WHERE t.user_id = u.id AND t.test_type = 'ielts' ORDER BY created_at DESC LIMIT 1) AS ielts,
    (SELECT COUNT(*)::int FROM applications a WHERE a.user_id = u.id) AS applications_count
  FROM users u
  LEFT JOIN user_profiles p ON p.user_id = u.id
  ORDER BY COALESCE(p.updated_at, u.created_at) DESC
`

app.get('/api/admin/leads', requireAdmin, asyncRoute(async (_req, res) => {
  const [applications, users] = await Promise.all([
    query(`
      SELECT a.id, a.status, a.created_at, u.email, u.full_name, p.phone, p.city, p.contact_consent,
        un.name AS university, COALESCE(un.slug, un.id::text) AS slug, un.country
      FROM applications a
      JOIN users u ON u.id = a.user_id
      JOIN universities un ON un.id = a.university_id
      LEFT JOIN user_profiles p ON p.user_id = u.id
      ORDER BY a.created_at DESC
    `),
    query(leadsQuery),
  ])
  res.json({ applications: applications.rows, users: users.rows, statuses: APPLICATION_STATUSES })
}))

app.patch('/api/admin/applications/:id', requireAdmin, asyncRoute(async (req, res) => {
  if (!APPLICATION_STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' })
  const result = await query('UPDATE applications SET status = $1 WHERE id = $2 RETURNING id, status', [req.body.status, req.params.id])
  if (!result.rows[0]) return res.status(404).json({ error: 'Application not found' })
  res.json(result.rows[0])
}))

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : Array.isArray(value) ? value.join(', ') : String(value)
  return /[",;\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// CSV открывается в Excel (BOM + точка с запятой как разделитель).
app.get('/api/admin/leads.csv', requireAdmin, asyncRoute(async (_req, res) => {
  const { rows } = await query(leadsQuery)
  const header = ['email', 'name', 'phone', 'city', 'graduation_year', 'study_level', 'target_groups', 'specialties', 'budget_kzt',
    'unt', 'ielts', 'ielts_test_band', 'career_types', 'consent', 'consent_at', 'applications', 'registered_at']
  const lines = rows.map(row => [
    row.email, row.full_name, row.phone, row.city, row.graduation_year, row.study_level, row.target_groups, row.specialties,
    row.budget, row.unt_score, row.ielts_score, row.ielts?.band, row.career?.top, row.contact_consent ? 'yes' : 'no',
    row.consent_at?.toISOString?.(), row.applications_count, row.registered_at?.toISOString?.(),
  ].map(csvCell).join(';'))
  res.set('Content-Type', 'text/csv; charset=utf-8')
  res.set('Content-Disposition', `attachment; filename="studichan-leads-${new Date().toISOString().slice(0, 10)}.csv"`)
  res.send(`﻿${[header.join(';'), ...lines].join('\r\n')}`)
}))

// Уведомление о новой заявке в Telegram. Работает, если в .env заданы
// TELEGRAM_BOT_TOKEN (бот от @BotFather) и TELEGRAM_CHAT_ID (куда писать).
const notifyNewApplication = async (user, universityId) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  const { rows } = await query(`
    SELECT un.name, un.country, p.phone, p.city FROM universities un
    LEFT JOIN user_profiles p ON p.user_id = $2 WHERE un.id = $1
  `, [universityId, user.id])
  const info = rows[0] || {}
  const text = [
    'Новая заявка на Studichan',
    `Вуз: ${info.name || universityId} (${info.country || ''})`,
    `Абитуриент: ${user.full_name || '—'}, ${user.email}`,
    info.phone ? `Телефон: ${info.phone}` : 'Телефон не указан',
    info.city ? `Город: ${info.city}` : '',
  ].filter(Boolean).join('\n')
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))

// SPA fallback.
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
})

// За nginx сервер слушает только 127.0.0.1 (HOST=127.0.0.1 в systemd-сервисе).
app.listen(port, process.env.HOST || '0.0.0.0', () => {
  console.log(`Studichan is running on port ${port}`)
})
