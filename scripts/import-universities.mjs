/*
 * Controlled university collector.
 *
 * It fetches only the official URLs explicitly approved in a CSV file, honours
 * basic robots.txt rules, waits between requests, and writes a review file by
 * default. It never searches Google, bypasses blocks, logs in, or tries CAPTCHA.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const argumentValue = (name) => {
  const position = args.indexOf(name)
  return position >= 0 ? args[position + 1] : undefined
}
const inputPath = path.resolve(projectRoot, argumentValue('--input') || 'data/university-sources.csv')
const shouldApply = args.includes('--apply')
const delayMs = Math.max(1000, Number(argumentValue('--delay-ms') || 2000))
const date = new Date().toISOString().slice(0, 10)
const outputPath = path.resolve(projectRoot, argumentValue('--output') || `data/review/universities-${date}.json`)
const contact = process.env.COLLECTOR_CONTACT || 'contact@example.com'
const userAgent = `StudichanUniversityCollector/1.0 (+${contact})`
const robotsCache = new Map()
const lastRequestByDomain = new Map()

const usage = () => {
  console.log(`
Usage:
  npm run import:universities -- --input data/university-sources.csv
  npm run import:universities -- --input data/university-sources.csv --apply

The first command only writes a review JSON file. Inspect it before --apply.
`)
}

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

const parseSourceRows = (csv) => {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('The input needs a header and at least one university.')
  const headers = rows[0].map((header) => header.trim().toLowerCase())
  const required = ['name', 'city', 'region', 'official_domain']
  const missing = required.filter((field) => !headers.includes(field))
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`)
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => {
    const item = Object.fromEntries(headers.map((header, column) => [header, (row[column] || '').trim()]))
    return { ...item, sourceRow: index + 2 }
  })
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const domainMatches = (hostname, approvedDomain) => {
  const allowed = approvedDomain.toLowerCase().replace(/^www\./, '')
  const current = hostname.toLowerCase().replace(/^www\./, '')
  return current === allowed || current.endsWith(`.${allowed}`)
}

const approvedUrl = (rawUrl, officialDomain) => {
  if (!rawUrl) return null
  let url
  try { url = new URL(rawUrl) } catch { throw new Error(`Invalid URL: ${rawUrl}`) }
  if (url.protocol !== 'https:') throw new Error(`Only HTTPS source URLs are allowed: ${rawUrl}`)
  if (!domainMatches(url.hostname, officialDomain)) {
    throw new Error(`Source ${url.hostname} is outside approved official domain ${officialDomain}`)
  }
  return url
}

const waitForDomain = async (hostname) => {
  const previous = lastRequestByDomain.get(hostname) || 0
  const remaining = delayMs - (Date.now() - previous)
  if (remaining > 0) await delay(remaining)
  lastRequestByDomain.set(hostname, Date.now())
}

const fetchText = async (url, officialDomain) => {
  await waitForDomain(url.hostname)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1' },
      redirect: 'follow', signal: controller.signal,
    })
    const finalUrl = new URL(response.url)
    if (!domainMatches(finalUrl.hostname, officialDomain)) {
      throw new Error(`Redirect left approved domain: ${finalUrl.hostname}`)
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return { url: finalUrl.href, text: await response.text(), status: response.status }
  } finally {
    clearTimeout(timeout)
  }
}

const parseRobots = (text, pathname) => {
  // Basic standard rules for User-agent: *. If no relevant rule is found, allow.
  const sections = text.replace(/\r/g, '').split(/\n\s*\n/)
  const rules = []
  for (const section of sections) {
    const lines = section.split('\n').map((line) => line.replace(/#.*/, '').trim()).filter(Boolean)
    const targetsAllBots = lines.some((line) => /^user-agent\s*:\s*\*/i.test(line))
    if (!targetsAllBots) continue
    for (const line of lines) {
      const match = line.match(/^(allow|disallow)\s*:\s*(.*)$/i)
      if (match && match[2]) rules.push({ type: match[1].toLowerCase(), path: match[2] })
    }
  }
  const matching = rules.filter((rule) => pathname.startsWith(rule.path)).sort((a, b) => b.path.length - a.path.length)
  return matching[0]?.type !== 'disallow'
}

const canFetch = async (url, officialDomain) => {
  const domain = url.hostname.toLowerCase()
  if (!robotsCache.has(domain)) {
    try {
      const robotsUrl = new URL('/robots.txt', url)
      const fetched = await fetchText(robotsUrl, officialDomain)
      robotsCache.set(domain, fetched.text)
    } catch {
      // A missing robots.txt permits normal access. Network errors are recorded per page.
      robotsCache.set(domain, '')
    }
  }
  return parseRobots(robotsCache.get(domain), url.pathname)
}

const decodeHtml = (value) => value
  .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#(\d+);/g, (_all, code) => String.fromCodePoint(Number(code)))

const attributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)]
    .map((match) => [match[1].toLowerCase(), decodeHtml(match[2] ?? match[3] ?? match[4] ?? '')]),
)

const pageMetadata = (html) => {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => attributes(match[0]))
  const description = metaTags.find((tag) => ['description', 'og:description'].includes((tag.name || tag.property || '').toLowerCase()))?.content || ''
  const visibleText = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  const clean = (text) => decodeHtml(text).replace(/\s+/g, ' ').trim()
  return { title: clean(title), description: clean(description), excerpt: clean(visibleText).slice(0, 500) }
}

const inspectPage = async (label, rawUrl, officialDomain) => {
  if (!rawUrl) return null
  const url = approvedUrl(rawUrl, officialDomain)
  if (!(await canFetch(url, officialDomain))) {
    return { label, url: url.href, status: 'skipped', reason: 'Blocked by robots.txt' }
  }
  try {
    const fetched = await fetchText(url, officialDomain)
    return { label, url: fetched.url, status: 'ok', fetchedAt: new Date().toISOString(), ...pageMetadata(fetched.text) }
  } catch (error) {
    return { label, url: url.href, status: 'error', reason: error.message }
  }
}

const reviewRecord = async (source) => {
  const urls = [
    ['home', source.website],
    ['admissions', source.admissions_url],
    ['programs', source.programs_url],
    ['fees', source.fees_url],
  ].filter(([, value], index, array) => value && array.findIndex(([, other]) => other === value) === index)
  const evidence = []
  for (const [label, url] of urls) evidence.push(await inspectPage(label, url, source.official_domain))
  const successful = evidence.filter((item) => item?.status === 'ok')
  const description = source.description || successful.find((item) => item.description)?.description || successful[0]?.excerpt || ''
  const sourceUrl = successful.find((item) => item.label === 'admissions')?.url || successful[0]?.url || source.admissions_url || source.website || ''
  return {
    sourceRow: source.sourceRow,
    status: successful.length ? 'ready_for_review' : 'needs_attention',
    university: {
      name: source.name, city: source.city, region: source.region,
      ranking: source.ranking ? Number(source.ranking) : null,
      specialties: source.specialties || '', requirements: source.requirements || '', tuition: source.tuition || '',
      description, website: source.website || '', source_url: sourceUrl, verified_at: date,
    },
    evidence,
  }
}

const upsertSql = `
  INSERT INTO universities (name, city, region, ranking, specialties, requirements, tuition, description, website, source_url, verified_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  ON CONFLICT (name) DO UPDATE SET
    city = EXCLUDED.city, region = EXCLUDED.region, ranking = EXCLUDED.ranking,
    specialties = EXCLUDED.specialties, requirements = EXCLUDED.requirements, tuition = EXCLUDED.tuition,
    description = EXCLUDED.description, website = EXCLUDED.website, source_url = EXCLUDED.source_url,
    verified_at = EXCLUDED.verified_at
`

if (args.includes('--help') || args.includes('-h')) {
  usage()
  process.exit(0)
}

const input = await readFile(inputPath, 'utf8')
const sources = parseSourceRows(input)
console.log(`Checking ${sources.length} approved university source record(s)…`)
const records = []
for (const source of sources) {
  try {
    records.push(await reviewRecord(source))
  } catch (error) {
    records.push({ sourceRow: source.sourceRow, status: 'needs_attention', university: { name: source.name }, evidence: [], error: error.message })
  }
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), input: path.relative(projectRoot, inputPath), records }, null, 2)}\n`)
console.log(`Review file written: ${path.relative(projectRoot, outputPath)}`)

const ready = records.filter((record) => record.status === 'ready_for_review')
if (!shouldApply) {
  console.log(`No database changes made. Review ${ready.length}/${records.length} record(s), then rerun with --apply.`)
  process.exit(0)
}

if (!ready.length) throw new Error('No approved records are ready to import.')
const { closeDb, initDb, withTransaction } = await import('../db.mjs')
try {
  await initDb()
  await withTransaction(async (client) => {
    for (const record of ready) {
      const item = record.university
      await client.query(upsertSql, [
        item.name, item.city, item.region, item.ranking, item.specialties, item.requirements,
        item.tuition, item.description, item.website, item.source_url, item.verified_at,
      ])
    }
  })
  console.log(`Imported ${ready.length} university record(s) into PostgreSQL.`)
} finally {
  await closeDb()
}
