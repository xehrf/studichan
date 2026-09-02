import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { initDb, closeDb, withTransaction } from '../db.mjs'

const args = process.argv.slice(2)
const valueOf = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}
const inputPath = valueOf('--input', 'data/university-sources.csv')
const translateUrl = (process.env.LIBRETRANSLATE_URL || 'http://localhost:5000/translate').replace(/\/$/, '')
const translateKey = process.env.LIBRETRANSLATE_API_KEY

const parseCsv = (csv) => {
  const rows = []
  let row = []
  let value = ''
  let quoted = false
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') { value += '"'; index += 1 } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(value.trim()); value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && csv[index + 1] === '\n') index += 1
      row.push(value.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []; value = ''
    } else value += char
  }
  row.push(value.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

const readSources = (csv) => {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('CSV needs a header and at least one university')
  const headers = rows[0].map((header) => header.toLowerCase().trim())
  for (const required of ['name', 'city', 'region']) {
    if (!headers.includes(required)) throw new Error(`Missing required column: ${required}`)
  }
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(
    headers.map((header, index) => [header, (row[index] || '').trim()]),
  ))
}

const translate = async (text, target) => {
  if (!text) return ''
  const body = { q: text, source: 'en', target, format: 'text' }
  if (translateKey) body.api_key = translateKey
  const response = await fetch(translateUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`LibreTranslate HTTP ${response.status}`)
  const result = await response.json()
  if (!result.translatedText) throw new Error('LibreTranslate returned no text')
  return result.translatedText
}

const translations = async (text) => ({
  en: text || '',
  ru: await translate(text, 'ru'),
  kk: await translate(text, 'kk'),
})

const findImage = async (name) => {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `${name} university building`, gsrlimit: '1',
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1200', format: 'json', origin: '*',
  })
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
  if (!response.ok) return null
  const data = await response.json()
  const page = Object.values(data.query?.pages || {})[0]
  const info = page?.imageinfo?.[0]
  if (!info?.thumburl) return null
  return { url: info.thumburl, source: info.descriptionurl || info.url }
}

const upsertSql = `
  INSERT INTO universities (
    name, city, region, ranking, specialties, requirements, tuition, description,
    website, source_url, verified_at, name_translations, description_translations,
    specialties_translations, requirements_translations, tuition_translations, image_url, image_source
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, $11, $12, $13, $14, $15, $16, $17)
  ON CONFLICT (name) DO UPDATE SET
    city = EXCLUDED.city, region = EXCLUDED.region, ranking = EXCLUDED.ranking,
    specialties = EXCLUDED.specialties, requirements = EXCLUDED.requirements, tuition = EXCLUDED.tuition,
    description = EXCLUDED.description, website = EXCLUDED.website, source_url = EXCLUDED.source_url,
    verified_at = CURRENT_DATE, name_translations = EXCLUDED.name_translations,
    description_translations = EXCLUDED.description_translations, specialties_translations = EXCLUDED.specialties_translations,
    requirements_translations = EXCLUDED.requirements_translations, tuition_translations = EXCLUDED.tuition_translations,
    image_url = EXCLUDED.image_url, image_source = EXCLUDED.image_source
`

const sources = readSources(await readFile(inputPath, 'utf8'))
await initDb()
try {
  await withTransaction(async (client) => {
    for (const source of sources) {
      const image = await findImage(source.name)
      const [nameTranslations, descriptionTranslations, specialtiesTranslations, requirementsTranslations, tuitionTranslations] = await Promise.all([
        translations(source.name), translations(source.description), translations(source.specialties),
        translations(source.requirements), translations(source.tuition),
      ])
      await client.query(upsertSql, [
        source.name, source.city, source.region, Number(source.ranking) || null, source.specialties || '',
        source.requirements || '', source.tuition || '', source.description || '', source.website || '',
        source.source_url || source.website || '', nameTranslations, descriptionTranslations,
        specialtiesTranslations, requirementsTranslations, tuitionTranslations, image?.url || null, image?.source || null,
      ])
      console.log(`Synced ${source.name}${image ? ' with image' : ''}`)
    }
  })
} finally {
  await closeDb()
}
