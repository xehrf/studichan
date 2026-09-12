import 'dotenv/config'
import dns from 'node:dns'
import net from 'node:net'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeDb, initDb, withTransaction } from '../db.mjs'

// Китайские вузы публикуют AAAA-записи в сети CERNET2. Без маршрута IPv6 выбор
// семейства адресов по умолчанию обрывает соединение вместо отката на IPv4.
net.setDefaultAutoSelectFamily(false)
dns.setDefaultResultOrder('ipv4first')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '..', 'prisma', 'data', 'universities.json')
const reviewDir = path.join(__dirname, '..', 'data', 'review')

const numericFlag = (name, fallback) => {
  const index = process.argv.indexOf(name)
  if (index === -1) return fallback
  const value = Number(process.argv[index + 1])
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`)
  return value
}

const requestedLimit = numericFlag('--limit', null)
const minGalleryImages = numericFlag('--min', 1)
const shouldApply = process.argv.includes('--apply')
const shouldRestoreMissing = process.argv.includes('--restore-missing')
const universities = JSON.parse(await readFile(dataPath, 'utf8'))
  .filter(item => item.nameEn && item.website)
  .sort((a, b) => (a.rankingNational || Number.MAX_SAFE_INTEGER) - (b.rankingNational || Number.MAX_SAFE_INTEGER))
  .slice(0, requestedLimit || undefined)
const delayMs = Number(process.env.IMAGE_SYNC_DELAY_MS || 1200)
const maxImages = 6
const maxCandidates = 30
const maxSceneryPages = 4
const maxAboutPages = 3
const maxAboutDepth = 2
const maxScrapedPages = 8
const maxSceneryDepth = 2

// Фотография кампуса и рекламный баннер отличаются по геометрии и по плотности
// сжатия: у плоской графики с текстом байт на пиксель в разы меньше, чем у фото.
const quality = {
  minWidth: 900,
  minHeight: 520,
  minBytes: 60000,
  minAspect: 1.1,
  maxAspect: 2.9,
  idealAspect: 1.55,
  minBytesPerPixel: { jpeg: 0.075, webp: 0.035, avif: 0.02, png: 0.45 },
}

const blockedUrlTerms = /(?:logo|icon|favicon|qrcode|qr-code|wechat|weixin|map|location|sprite|badge|seal|avatar|visitcount|counter|banner|lunbo|carousel|slider|poster|haibao|advert|placeholder|default|blank|nopic|watermark|shuiyin)/i
const blockedContextTerms = /(?:header|footer|nav|menu|share|search|language|accessibility|logo|qr|advert)/i
const supportedImagePath = /\.(?:avif|jpe?g|png|webp)$/i
// Разделы с видами кампуса. Список узкий намеренно: «图片», «photo», «校园生活»
// и «风采» ведут в ленту новостей, где сняты церемонии, совещания и спектакли.
// Латинские куски — типовые адреса разделов: xyfg = сяоюань фэнгуан, виды кампуса.
const sceneryLinkTerms = /(?:校园风光|校园景色|校园景观|校园环境|校园掠影|校园巡礼|美丽校园|风光|景色|掠影|campus\s*(?:scenery|view|tour)|scenery|virtual\s*tour|\b(?:xyfg|xxfg|xyfc|fgml|mlxy|xyjs)\b)/i
const aboutLinkTerms = /(?:走进|学校概况|学校简介|学校介绍|概况|简介|关于我们|about\s*us|about|overview|introduction)/i
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

const stripTags = (value) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const anchors = (html) => html.match(/<a\b[^>]*>[\s\S]{0,300}?<\/a>/gi) || []

const matchingLinks = (html, pageUrl, host, terms) => {
  const links = []
  for (const tag of anchors(html)) {
    const href = attribute(tag, 'href')
    const text = `${stripTags(tag)} ${attribute(tag, 'title')} ${href}`
    if (!href || !terms.test(text)) continue
    const url = absoluteUrl(href, pageUrl)
    if (!url || !isOfficialUrl(url, host)) continue
    if (/\.(?:pdf|docx?|xlsx?|pptx?|zip|rar|mp4|avi)$/i.test(new URL(url).pathname)) continue
    if (url.replace(/#.*$/, '') === pageUrl.replace(/#.*$/, '')) continue
    links.push(url)
  }
  return [...new Set(links)]
}

// Собираем только со страниц видов кампуса. Проверка показала, что с главных
// страниц приходят съёмки церемоний и совещаний, а не корпуса и аудитории.
const imageCandidates = (html, pageUrl, host) => {
  const candidates = []
  const add = (value) => {
    const url = absoluteUrl(value, pageUrl)
    if (!url || !isOfficialUrl(url, host)) return
    if (!supportedImagePath.test(new URL(url).pathname) || blockedUrlTerms.test(url)) return
    candidates.push({ url, page: pageUrl })
  }

  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const context = `${attribute(tag, 'class')} ${attribute(tag, 'alt')} ${attribute(tag, 'id')}`
    if (blockedContextTerms.test(context)) continue
    add(attribute(tag, 'data-src') || attribute(tag, 'data-original') || attribute(tag, 'src'))
  }

  // Превью в таких галереях часто ссылается на полноразмерный файл.
  for (const tag of anchors(html)) add(attribute(tag, 'href'))

  return candidates
}

const readJpegSize = (buffer) => {
  let offset = 2
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue }
    const marker = buffer[offset + 1]
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue }
    const length = buffer.readUInt16BE(offset + 2)
    if (length < 2) return null
    const isFrameHeader = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (isFrameHeader) return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) }
    offset += 2 + length
  }
  return null
}

const readPngSize = (buffer) => buffer.length >= 24 && buffer.toString('ascii', 12, 16) === 'IHDR'
  ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  : null

const readWebpSize = (buffer) => {
  if (buffer.length < 30 || buffer.toString('ascii', 8, 12) !== 'WEBP') return null
  const chunk = buffer.toString('ascii', 12, 16)
  if (chunk === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (chunk === 'VP8X') return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 }
  return null
}

const readAvifSize = (buffer) => {
  const index = buffer.indexOf('ispe', 0, 'ascii')
  return index > 0 && index + 16 <= buffer.length
    ? { width: buffer.readUInt32BE(index + 8), height: buffer.readUInt32BE(index + 12) }
    : null
}

const imageFormat = (contentType, buffer) => {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpeg'
  if (buffer.length > 8 && buffer.toString('ascii', 1, 4) === 'PNG') return 'png'
  if (buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF') return 'webp'
  if (buffer.includes('ftypavif', 0, 'ascii') || buffer.includes('ftypmif1', 0, 'ascii')) return 'avif'
  return /image\/(avif|jpeg|png|webp)/i.exec(contentType)?.[1]?.toLowerCase().replace('jpg', 'jpeg') || null
}

const imageSize = (format, buffer) => {
  if (format === 'jpeg') return readJpegSize(buffer)
  if (format === 'png') return readPngSize(buffer)
  if (format === 'webp') return readWebpSize(buffer)
  if (format === 'avif') return readAvifSize(buffer)
  return null
}

const totalBytes = (response, fallback) => {
  const contentRange = response.headers.get('content-range')
  const rangedSize = contentRange?.match(/\/(\d+)$/)?.[1]
  return Number(rangedSize || response.headers.get('content-length') || fallback || 0)
}

const readHead = async (response, limit) => {
  const reader = response.body?.getReader()
  if (!reader) return Buffer.alloc(0)
  const chunks = []
  let total = 0
  try {
    while (total < limit) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(Buffer.from(value))
      total += value.length
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  return Buffer.concat(chunks).subarray(0, limit)
}

const measureImage = async (url) => {
  const response = await fetch(url, {
    headers: { range: 'bytes=0-65535', accept: 'image/avif,image/webp,image/png,image/jpeg' },
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const contentType = response.headers.get('content-type') || ''
  const head = await readHead(response, 65536)
  const format = imageFormat(contentType, head)
  if (!format) throw new Error('not an image')
  const size = imageSize(format, head)
  if (!size?.width || !size?.height) throw new Error('unreadable dimensions')
  const bytes = totalBytes(response, head.length)
  return { format, width: size.width, height: size.height, bytes }
}

const inspect = async (candidate) => {
  let measured
  try {
    measured = await measureImage(candidate.url)
  } catch (error) {
    return { ...candidate, rejected: error.message }
  }

  const { format, width, height, bytes } = measured
  const aspect = width / height
  const bytesPerPixel = bytes / (width * height)
  const minDensity = quality.minBytesPerPixel[format] ?? quality.minBytesPerPixel.jpeg
  const details = { format, width, height, bytes, aspect: Number(aspect.toFixed(2)), bytesPerPixel: Number(bytesPerPixel.toFixed(4)) }

  if (width < quality.minWidth || height < quality.minHeight) return { ...candidate, ...details, rejected: 'too small' }
  if (bytes && bytes < quality.minBytes) return { ...candidate, ...details, rejected: 'file too light' }
  if (aspect < quality.minAspect) return { ...candidate, ...details, rejected: 'portrait or square' }
  if (aspect > quality.maxAspect) return { ...candidate, ...details, rejected: 'banner strip shape' }
  // Плоская графика с текстом жмётся в разы сильнее фотографии.
  if (bytes && bytesPerPixel < minDensity) return { ...candidate, ...details, rejected: 'flat graphic, likely a text banner' }

  const pixelScore = Math.min((width * height) / 2000000, 1) * 40
  const aspectScore = 30 - Math.min(Math.abs(aspect - quality.idealAspect), 1) * 30
  const densityScore = Math.min(bytesPerPixel / (minDensity * 2), 1) * 20
  return { ...candidate, ...details, score: Number((pixelScore + aspectScore + densityScore).toFixed(1)) }
}

const fetchPage = async (url, host) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Studichan image catalogue bot/1.0 (official university images; contact: admin@studichan.app)',
      accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Page returned ${response.status}`)
  if (!isOfficialUrl(response.url, host)) throw new Error('Page redirected outside the official domain')
  return { url: response.url, html: await response.text() }
}

// Раздел видов кампуса редко висит на главной. Обычно он лежит на два-три клика
// вглубь, внутри «走进вуз» или «学校概况», поэтому раздел «о вузе» обходим вширь.
const findSceneryPages = async (homepage, host) => {
  const found = matchingLinks(homepage.html, homepage.url, host, sceneryLinkTerms)
  const queue = matchingLinks(homepage.html, homepage.url, host, aboutLinkTerms).slice(0, maxAboutPages).map(url => ({ url, depth: 1 }))
  const visited = new Set([homepage.url])

  while (queue.length && visited.size <= maxAboutPages * 3 && found.length < maxSceneryPages) {
    const { url, depth } = queue.shift()
    if (visited.has(url)) continue
    visited.add(url)
    let page
    try {
      page = await fetchPage(url, host)
    } catch {
      continue
    }
    found.push(...matchingLinks(page.html, page.url, host, sceneryLinkTerms))
    if (found.length || depth >= maxAboutDepth) continue
    for (const link of matchingLinks(page.html, page.url, host, aboutLinkTerms).slice(0, maxAboutPages)) {
      if (!visited.has(link)) queue.push({ url: link, depth: depth + 1 })
    }
  }
  return [...new Set(found)].slice(0, maxSceneryPages)
}

const findOfficialImages = async (university) => {
  const host = officialHost(university.website)
  const homepage = await fetchPage(university.website, host)
  const candidates = []
  const visitedPages = []
  const queue = (await findSceneryPages(homepage, host)).map(url => ({ url, depth: 1 }))
  const seen = new Set(queue.map(item => item.url))

  // В списках галереи лежат превью, полноразмерные снимки — на вложенных страницах.
  while (queue.length && visitedPages.length < maxScrapedPages) {
    const { url, depth } = queue.shift()
    let page
    try {
      page = await fetchPage(url, host)
    } catch {
      continue
    }
    visitedPages.push(page.url)
    candidates.push(...imageCandidates(page.html, page.url, host))
    if (depth >= maxSceneryDepth) continue
    for (const link of matchingLinks(page.html, page.url, host, sceneryLinkTerms)) {
      if (seen.has(link) || seen.size >= maxScrapedPages * 2) continue
      seen.add(link)
      queue.push({ url: link, depth: depth + 1 })
    }
  }

  const unique = [...new Map(candidates.map(item => [item.url, item])).values()].slice(0, maxCandidates)
  const inspected = await Promise.all(unique.map(inspect))
  const accepted = inspected.filter(item => !item.rejected).sort((a, b) => b.score - a.score).slice(0, maxImages)
  const rejected = inspected.filter(item => item.rejected)
  return { accepted: accepted.map(item => ({ ...item, source: item.page })), rejected, sceneryPages: visitedPages }
}

const results = []
console.log(`Scanning ${universities.length} university website(s).`)
for (const university of universities) {
  try {
    const { accepted, rejected, sceneryPages } = await findOfficialImages(university)
    results.push({
      name: university.nameEn,
      website: university.website,
      sceneryPages,
      images: accepted,
      rejected,
      status: accepted.length >= minGalleryImages ? 'ready' : accepted.length ? 'below-minimum' : 'no-suitable-images',
    })
    console.log(`${university.nameEn}: ${accepted.length} photo(s) kept, ${rejected.length} rejected, ${sceneryPages.length} scenery page(s)`)
  } catch (error) {
    results.push({ name: university.nameEn, website: university.website, sceneryPages: [], images: [], rejected: [], status: 'failed', error: error.message })
    console.warn(`${university.nameEn}: ${error.message}`)
  }
  await sleep(delayMs)
}

await mkdir(reviewDir, { recursive: true })
const reviewPath = path.join(reviewDir, `official-images-${new Date().toISOString().slice(0, 10)}.json`)
await writeFile(reviewPath, `${JSON.stringify(results, null, 2)}\n`)
const ready = results.filter(item => item.images.length >= minGalleryImages)
console.log(`Review written to ${reviewPath}`)
console.log(`Ready: ${ready.length}. Below minimum: ${results.filter(item => item.status === 'below-minimum').length}. Empty: ${results.filter(item => item.status === 'no-suitable-images').length}. Failed: ${results.filter(item => item.status === 'failed').length}.`)

// Где подходящих снимков нет, в базе остаётся мусор от прошлых запусков.
// Возвращаем туда проверенное фото из каталога вместо рекламного баннера.
const coverByName = new Map(universities.filter(item => item.coverUrl).map(item => [item.nameEn, item.coverUrl]))
// Сайт, не ответивший из-за сети, не трогаем: там могла остаться годная галерея.
const restorable = shouldRestoreMissing
  ? results.filter(item => item.status === 'no-suitable-images' && coverByName.has(item.name))
  : []

if (shouldApply) {
  await initDb()
  try {
    await withTransaction(async (client) => {
      for (const result of ready) {
        const gallery = result.images.map(({ url, source }) => ({ url, source }))
        await client.query(`
          UPDATE universities
          SET image_url = $1, image_source = $2, image_gallery = $3
          WHERE name = $4
        `, [gallery[0].url, gallery[0].source, JSON.stringify(gallery), result.name])
      }
      for (const result of restorable) {
        const cover = coverByName.get(result.name)
        await client.query(`
          UPDATE universities
          SET image_url = $1, image_source = $1, image_gallery = $2
          WHERE name = $3
        `, [cover, JSON.stringify([{ url: cover, source: cover }]), result.name])
      }
    })
  } finally {
    await closeDb()
  }
  console.log(`Applied ${ready.length} scraped galleries${restorable.length ? ` and restored ${restorable.length} catalogue covers` : ''}.`)
} else {
  const flags = `${minGalleryImages > 1 ? ` --min ${minGalleryImages}` : ''}${shouldRestoreMissing ? ' --restore-missing' : ''}`
  console.log(`Review the report, then run: npm run sync:images -- --apply${flags}`)
}
