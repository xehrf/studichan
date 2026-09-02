import { closeDb, initDb } from '../db.mjs'

try {
  await initDb()
  console.log('PostgreSQL schema is ready.')
} finally {
  await closeDb()
}
