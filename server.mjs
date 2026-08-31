import express from 'express'
import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir } from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 3000)
const runtimeDir = path.join(__dirname, '.runtime')

// Создание директории перед БД
await mkdir(runtimeDir, { recursive: true })

// Инициализация БД
const db = new Database(path.join(runtimeDir, 'universities.db'))
db.pragma('journal_mode = WAL')

// Создание таблиц
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS universities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      region TEXT NOT NULL,
      ranking INTEGER,
      specialties TEXT,
      requirements TEXT,
      tuition TEXT,
      description TEXT,
      agency_id INTEGER,
      students_count INTEGER DEFAULT 0,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS agencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      phone TEXT,
      website TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT,
      country TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      university_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(university_id) REFERENCES universities(id)
    );
  `)
}

initDb()

app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

// Здоровье
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: 'connected' })
})

// Получить все университеты (с фильтром)
app.get('/api/universities', (req, res) => {
  const { region, specialty, search } = req.query
  let query = 'SELECT id, name, city, region, ranking, specialties, tuition, agency_id, students_count FROM universities WHERE 1=1'
  const params = []

  if (region) {
    query += ' AND region = ?'
    params.push(region)
  }
  if (specialty) {
    query += ' AND specialties LIKE ?'
    params.push(`%${specialty}%`)
  }
  if (search) {
    query += ' AND (name LIKE ? OR city LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  query += ' ORDER BY ranking ASC, name ASC'
  const stmt = db.prepare(query)
  const universities = stmt.all(...params)
  res.json(universities)
})

// Получить один университет
app.get('/api/universities/:id', (req, res) => {
  const { id } = req.params
  const stmt = db.prepare('SELECT * FROM universities WHERE id = ?')
  const university = stmt.get(id)
  if (!university) return res.status(404).json({ error: 'University not found' })

  let agency = null
  if (university.agency_id) {
    const agencyStmt = db.prepare('SELECT * FROM agencies WHERE id = ?')
    agency = agencyStmt.get(university.agency_id)
  }

  res.json({ ...university, agency })
})

// Регистрация пользователя
app.post('/api/auth/register', (req, res) => {
  const { email, password, fullName, country, phone } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const stmt = db.prepare('INSERT INTO users (email, password, full_name, country, phone) VALUES (?, ?, ?, ?, ?)')
    const result = stmt.run(email, password, fullName || '', country || '', phone || '')
    res.json({ ok: true, userId: result.lastInsertRowid })
  } catch (error) {
    res.status(400).json({ error: 'Email already registered' })
  }
})

// Вход
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const stmt = db.prepare('SELECT id, email, full_name FROM users WHERE email = ? AND password = ?')
  const user = stmt.get(email, password)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  res.json({ ok: true, user })
})

// Подать заявку на университет
app.post('/api/applications', (req, res) => {
  const { userId, universityId } = req.body
  if (!userId || !universityId) return res.status(400).json({ error: 'User and university IDs required' })

  try {
    const stmt = db.prepare('INSERT INTO applications (user_id, university_id) VALUES (?, ?)')
    stmt.run(userId, universityId)
    res.json({ ok: true })
  } catch (error) {
    res.status(400).json({ error: 'Application already exists' })
  }
})

// Служебные: добавить тестовые данные (только для разработки)
app.post('/api/admin/seed', (req, res) => {
  try {
    const agencies = [
      { name: 'Study China Pro', email: 'info@studychinapro.com', phone: '+86-10-1234567', website: 'studychinapro.com' },
      { name: 'Dragon Education', email: 'contact@dragonedu.com', phone: '+86-20-2345678', website: 'dragonedu.com' },
    ]

    const universities = [
      { name: 'Tsinghua University', city: 'Beijing', region: 'North', ranking: 1, specialties: 'Engineering, Computer Science, Business', requirements: 'HSK 4+, Bachelor degree', tuition: '$3000-5000 per year', description: 'Top ranked university in China', agency_id: null, students_count: 0 },
      { name: 'Peking University', city: 'Beijing', region: 'North', ranking: 2, specialties: 'Law, Medicine, Liberal Arts', requirements: 'HSK 5+, Bachelor degree', tuition: '$3500-6000 per year', description: 'Prestigious research university', agency_id: null, students_count: 0 },
      { name: 'Fudan University', city: 'Shanghai', region: 'East', ranking: 3, specialties: 'Business, Economics, Medicine', requirements: 'HSK 4+, Bachelor degree', tuition: '$3000-5500 per year', description: 'Leading university in China', agency_id: null, students_count: 0 },
      { name: 'Shanghai Jiao Tong University', city: 'Shanghai', region: 'East', ranking: 4, specialties: 'Engineering, Computer Science', requirements: 'HSK 4+, Bachelor degree', tuition: '$2800-4800 per year', description: 'Elite engineering university', agency_id: 1, students_count: 150 },
    ]

    agencies.forEach(a => {
      try {
        db.prepare('INSERT INTO agencies (name, email, phone, website) VALUES (?, ?, ?, ?)').run(a.name, a.email, a.phone, a.website)
      } catch (_) {}
    })

    universities.forEach(u => {
      try {
        db.prepare('INSERT INTO universities (name, city, region, ranking, specialties, requirements, tuition, description, agency_id, students_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          u.name, u.city, u.region, u.ranking, u.specialties, u.requirements, u.tuition, u.description, u.agency_id, u.students_count
        )
      } catch (_) {}
    })

    res.json({ ok: true, message: 'Seed data added' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// SPA fallback
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(port, () => console.log(`Chinese Universities API on http://localhost:${port}`))
