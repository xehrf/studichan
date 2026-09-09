import 'dotenv/config'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeDb, initDb, withTransaction } from '../db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '..', 'prisma', 'data', 'universities.json')
const reviewDir = path.join(__dirname, '..', 'data', 'review')
const limitIndex = process.argv.indexOf('--limit')
const requestedLimit = limitIndex === -1 ? null : Number(process.argv[limitIndex + 1])
if (requestedLimit !== null && (!Number.isInteger(requestedLimit) || requestedLimit < 1)) {
  throw new Error('--limit must be a positive integer')
}
const universities = JSON.parse(await readFile(dataPath, 'utf8'))
  .filter(item => item.nameEn && item.website)
  .sort((a, b) => (a.rankingNational || Number.MAX_SAFE_INTEGER) - (b.rankingNational || Number.MAX_SAFE_INTEGER))
  .slice(0, requestedLimit || undefined)
const delayMs = Number(process.env.IMAGE_SYNC_DELAY_MS || 1200)
const shouldApply = process.argv.includes('--apply')
const maxImages = 6
const blockedImageTerms = /(?:logo|icon|favicon|qrcode|qr-code|wechat|map|location|sprite|badge|seal|avatar|banner-text|visitcount|counter)/i
const blockedContextTerms = /(?:header|footer|nav|menu|share|search|language|accessibility)/i
const supportedImagePath = /\.(?:avif|jpe?g|png|webp)$/i
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const officialHost = (website) => new URL(website).hostname.replace(/^www\./, '').toLowerCase()
const isOfficialUrl = (url, host) => {
  try {
    const candidateHost = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    return candidateHost === host || candidateHost.endsWith(`.${host}`)
  } catch {
    return false
  }
}

const decodeHtml = (value) => value
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#x27;|&#39;/gi, "'")
  .trim()

const absoluteUrl = (value, pageUrl) => {
  try {
    return new URL(decodeHtml(value), pageUrl).href
  } catch {
    return null
  }
}

const attribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return match?.[1] || match?.[2] || match?.[3] || ''
}

const imageCandidates = (html, pageUrl, host) => {
  const candidates = []
  const add = (value, score) => {
    const url = absoluteUrl(value, pageUrl)
    if (!url || !isOfficialUrl(url, host) || !supportedImagePath.test(new URL(url).pathname) || blockedImageTerms.test(url)) return
    candidates.push({ url, score })
  }

  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const property = attribute(tag, 'property').toLowerCase()
    const name = attribute(tag, 'name').toLowerCase()
    if (property === 'og:image' || name === 'twitter:image') add(attribute(tag, 'content'), 100)
  }

  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const src = attribute(tag, 'data-src') || attribute(tag, 'data-original') || attribute(tag, 'src')
    const width = Number(attribute(tag, 'width')) || 0
    const height = Number(attribute(tag, 'height')) || 0
    const className = `${attribute(tag, 'class')} ${attribute(tag, 'alt')}`
    if (blockedContextTerms.test(className)) continue
    let score = 40 + Math.min(width * height / 50000, 30)
    if (/campus|building|library|classroom|laboratory|gallery|slider|hero/i.test(className)) score += 30
    if (width && width < 500) score -= 50
    if (height && height < 250) score -= 50
    add(src, score)
  }

  return [...new Map(candidates.sort((a, b) => b.score - a.score).map(item => [item.url, item])).values()]
    .slice(0, 14)
}

const imageSize = (response) => {
  const contentRange = response.headers.get('content-range')
  const rangedSize = contentRange?.match(/\/(\d+)$/)?.[1]
  return Number(rangedSize || response.headers.get('content-length') || 0)
}

const isUsableImage = async (image) => {
  try {
    const response = await fetch(image.url, {
      headers: { range: 'bytes=0-32767', accept: 'image/avif,image/webp,image/png,image/jpeg' },
      signal: AbortSignal.timeout(12000),
    })
    const contentType = response.headers.get('content-type') || ''
    const size = imageSize(response)
    response.body?.cancel()
    return /^image\/(?:avif|jpeg|png|webp)/i.test(contentType) && (size === 0 || size >= 50000)
  } catch {
    return false
  }
}

const findOfficialImages = async (university) => {
  const host = officialHost(university.website)
  const response = await fetch(university.website, {
    headers: {
      'user-agent': 'Studichan image catalogue bot/1.0 (official university images; contact: admin@studichan.app)',
      accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Homepage returned ${response.status}`)
  const finalUrl = response.url
  if (!isOfficialUrl(finalUrl, host)) throw new Error('Homepage redirected outside the official domain')
  const html = await response.text()
  const candidates = imageCandidates(html, finalUrl, host)
  const usable = await Promise.all(candidates.map(async image => (await isUsableImage(image) ? image : null)))
  return usable.filter(Boolean).slice(0, maxImages).map(image => ({ ...image, source: finalUrl }))
}

const results = []
console.log(`Scanning ${universities.length} university website(s).`)
for (const university of universities) {
  try {
    const images = await findOfficialImages(university)
    results.push({ name: university.nameEn, website: university.website, images, status: images.length ? 'ready' : 'no-suitable-images' })
    console.log(`${university.nameEn}: ${images.length} official image(s)`)
  } catch (error) {
    results.push({ name: university.nameEn, website: university.website, images: [], status: 'failed', error: error.message })
    console.warn(`${university.nameEn}: ${error.message}`)
  }
  await sleep(delayMs)
}

await mkdir(reviewDir, { recursive: true })
const reviewPath = path.join(reviewDir, `official-images-${new Date().toISOString().slice(0, 10)}.json`)
await writeFile(reviewPath, `${JSON.stringify(results, null, 2)}\n`)
console.log(`Review written to ${reviewPath}`)

if (shouldApply) {
  await initDb()
  try {
    await withTransaction(async (client) => {
      for (const result of results.filter(item => item.images.length)) {
        const gallery = result.images.map(({ url, source }) => ({ url, source }))
        await client.query(`
          UPDATE universities
          SET image_url = $1, image_source = $2, image_gallery = $3
          WHERE name = $4
        `, [gallery[0].url, gallery[0].source, JSON.stringify(gallery), result.name])
      }
    })
  } finally {
    await closeDb()
  }
  console.log(`Applied ${results.filter(item => item.images.length).length} university galleries.`)
} else {
  console.log('Review the report, then run: npm run sync:images -- --apply')
}
