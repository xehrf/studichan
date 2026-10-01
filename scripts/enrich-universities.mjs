// Собирает проверяемые данные о вузах из открытых источников и сохраняет их в
// prisma/data/enrichment.json (сид читает этот файл, сеть ему не нужна).
//
// - Место в QS World University Rankings 2026 — из открытой выгрузки рейтинга
//   (CSV, ссылка ниже; свой файл можно передать через --qs path.csv).
// - Фото кампуса, координаты, год основания, число студентов и казахское
//   название — из Wikipedia и Wikidata. Фото хранятся ссылками на Wikimedia
//   Commons вместе со страницей файла (для указания авторства).
//
//   npm run enrich:universities              # всё
//   npm run enrich:universities -- --only qs # только рейтинг
//   npm run enrich:universities -- --only wiki
import { readFile, writeFile } from 'node:fs/promises'
import { enrichmentPath, loadCatalog, readEnrichment } from './catalog.mjs'

const QS_CSV_URL = 'https://raw.githubusercontent.com/CheekyRishi/2026-qs-world-university-eda/HEAD/2026%20QS%20World%20University%20Rankings.csv'
const USER_AGENT = 'StudichanCatalog/1.0 (university catalogue; https://github.com/xehrf/studichan)'
const args = process.argv.slice(2)
const flag = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}
const only = flag('--only')
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const qsCountries = {
  'United States of America': 'US', 'United Kingdom': 'GB', 'China (Mainland)': 'CN', 'Hong Kong SAR, China': 'HK',
  Germany: 'DE', Japan: 'JP', 'Republic of Korea': 'KR', Italy: 'IT', 'Russian Federation': 'RU', Spain: 'ES',
  Australia: 'AU', France: 'FR', Malaysia: 'MY', Canada: 'CA', Türkiye: 'TR', Kazakhstan: 'KZ', Poland: 'PL',
  Czechia: 'CZ', Netherlands: 'NL', 'United Arab Emirates': 'AE', Switzerland: 'CH', Belgium: 'BE', Hungary: 'HU',
  Finland: 'FI', 'New Zealand': 'NZ', Sweden: 'SE', Ireland: 'IE', Austria: 'AT', Denmark: 'DK', Singapore: 'SG',
  Estonia: 'EE',
}

const parseCsv = (text) => {
  const rows = []
  let row = []
  let value = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1 } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(value); value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(value)
      if (row.some(Boolean)) rows.push(row)
      row = []; value = ''
    } else value += char
  }
  row.push(value)
  if (row.some(Boolean)) rows.push(row)
  const [header, ...body] = rows
  const keys = header.map(key => key.replace(/^﻿/, '').trim())
  return body.map(cells => Object.fromEntries(keys.map((key, index) => [key, (cells[index] || '').trim()])))
}

// Пояснения в скобках у QS — обычно аббревиатуры («(MIT)»), их отбрасываем. У нас
// скобки различают кампусы («China University of Geosciences (Beijing)»), их оставляем.
const stripParentheses = (value) => String(value).replace(/\([^)]*\)/g, ' ')
const normalizeName = (value) => String(value)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/\buniversitat\b|\buniversitaet\b|\buniversite\b|\buniversita\b|\buniversidad\b|\buniversiteit\b/g, 'university')
  .replace(/\bthe\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const commonWords = new Set(['university', 'of', 'and', 'in', 'at', 'de', 'di', 'zu'])
const tokens = (value) => new Set(normalizeName(value).split(' ').filter(word => word && !commonWords.has(word)))
const similarity = (a, b) => {
  const left = tokens(a)
  const right = tokens(b)
  if (!left.size || !right.size) return 0
  let shared = 0
  for (const word of left) if (right.has(word)) shared += 1
  return shared / Math.max(left.size, right.size)
}

const parseRank = (value) => {
  const label = String(value || '').replace(/^=/, '').trim()
  const rank = Number.parseInt(label, 10)
  return Number.isInteger(rank) ? { qsRank: rank, qsLabel: label.replace('-', '–') } : null
}

const matchQs = async (records, enrichment) => {
  const source = flag('--qs')
  const text = source ? await readFile(source, 'utf8') : await (await fetch(QS_CSV_URL, { headers: { 'User-Agent': USER_AGENT } })).text()
  const rows = parseCsv(text)
  const byCountry = new Map()
  for (const row of rows) {
    const country = qsCountries[row['Country/Territory']]
    if (!country) continue
    if (!byCountry.has(country)) byCountry.set(country, [])
    byCountry.get(country).push(row)
  }

  const fuzzy = []
  const missing = []
  for (const record of records) {
    const candidates = byCountry.get(record.country) || []
    const name = (row) => stripParentheses(row['Institution Name'])
    let match = record.qsName && candidates.find(row => row['Institution Name'] === record.qsName)
    if (record.qsName && !match) missing.push(`${record.slug}: qs override "${record.qsName}" not found`)
    match ||= candidates.find(row => normalizeName(name(row)) === normalizeName(record.names.en))
    if (!match && !record.qsName) {
      const scored = candidates
        .map(row => ({ row, score: similarity(name(row), record.names.en) }))
        .sort((a, b) => b.score - a.score)
      // Совпадение всех значимых слов: «Humboldt-Universität zu Berlin» = «Humboldt University of Berlin».
      if (scored[0]?.score === 1 && (scored[1]?.score || 0) < 1) {
        match = scored[0].row
        fuzzy.push(`${record.slug}: "${record.names.en}" ≈ "${match['Institution Name']}" (${match['2026 Rank']})`)
      }
    }
    const entry = (enrichment[record.slug] ||= {})
    delete entry.qsRank
    delete entry.qsLabel
    const rank = match && parseRank(match['2026 Rank'])
    if (rank) Object.assign(entry, rank)
  }
  const ranked = records.filter(record => enrichment[record.slug]?.qsRank).length
  console.log(`QS 2026: ${ranked} of ${records.length} universities ranked.`)
  if (fuzzy.length) console.log(`Fuzzy matches to review:\n  ${fuzzy.join('\n  ')}`)
  if (missing.length) console.log(`Problems:\n  ${missing.join('\n  ')}`)
  if (args.includes('--verbose')) {
    const unranked = records.filter(record => !enrichment[record.slug]?.qsRank).map(record => {
      const best = (byCountry.get(record.country) || [])
        .map(row => ({ row, score: similarity(stripParentheses(row['Institution Name']), record.names.en) }))
        .sort((a, b) => b.score - a.score)[0]
      return `${record.slug}: ${record.names.en}${best?.score > 0.3 ? ` → maybe "${best.row['Institution Name']}" (${best.row['2026 Rank']})` : ''}`
    })
    console.log(`Not in QS 2026:\n  ${unranked.join('\n  ')}`)
  }
}

const api = async (base, params) => {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  let status = 0
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(30000) })
      .catch(error => ({ ok: false, status: error.code || error.name, headers: new Headers() }))
    status = response.status
    if (response.ok) {
      const data = await response.json()
      if (!data.error) return data
    }
    // Wikimedia просит соблюдать Retry-After при 429.
    const retryAfter = Number(response.headers.get('retry-after'))
    await sleep(Math.max(retryAfter * 1000 || 0, 3000 * attempt))
  }
  throw new Error(`Request failed with HTTP ${status}: ${url.slice(0, 160)}`)
}
// `wiki` в данных — заголовок статьи английской Википедии; для вузов, о которых
// есть только русская статья, пишется с префиксом: "ru:Университет Шакарима".
const wikiRef = (value) => {
  const match = String(value).match(/^([a-z]{2}):(.+)$/)
  return match ? { lang: match[1], title: match[2] } : { lang: 'en', title: value }
}
const wikipedia = (lang, params) => api(`https://${lang}.wikipedia.org/w/api.php`, { action: 'query', ...params })
const commons = (params) => api('https://commons.wikimedia.org/w/api.php', { action: 'query', ...params })
const wikidata = (params) => api('https://www.wikidata.org/w/api.php', params)
const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, index) => list.slice(index * size, index * size + size))

// Логотипы, гербы, карты и схемы не подходят для обложки и галереи.
const unwantedFile = /(?:logo|seal|emblem|coat[_ ]of[_ ]arms|crest|flag|map|locator|location|icon|signature|diagram|chart|plan\b|wordmark|badge|insignia|portrait|headshot|stamp|banner|логотип|герб|эмблем|карта|флаг|печать|портрет|марка)/i
const isPhoto = (title) => /\.jpe?g$/i.test(title) && !unwantedFile.test(title)
// В русской Википедии файлы называются «Файл:…», на Commons — «File:…».
const commonsTitle = (title) => title.replace(/^[^:]+:/, 'File:')

const resolveTitles = (data, requested) => {
  const forward = new Map(requested.map(title => [title, title]))
  for (const step of [...(data.query?.normalized || []), ...(data.query?.redirects || [])]) {
    for (const [original, current] of forward) if (current === step.from) forward.set(original, step.to)
  }
  return forward
}

// Грубые границы стран [lat min, lat max, lon min, lon max]: если статья
// указывает на точку вне страны, Википедия нашла другой вуз с похожим названием.
const countryBounds = {
  KZ: [40, 56, 46, 88], CN: [18, 54, 73, 135], HK: [22, 23, 113.8, 114.5], US: [18, 72, -170, -66], GB: [49, 61, -9, 2],
  DE: [47, 55, 5, 16], FR: [41, 52, -5, 10], CH: [45.8, 48, 5.9, 10.6], NL: [50.7, 53.7, 3.3, 7.3], IT: [36, 47.2, 6.6, 18.6],
  ES: [27, 44, -18.5, 4.5], SE: [55, 69.1, 10.9, 24.2], DK: [54.5, 57.8, 8, 15.2], FI: [59.7, 70.1, 20, 31.6],
  BE: [49.5, 51.6, 2.5, 6.5], AT: [46.3, 49.1, 9.5, 17.2], IE: [51.3, 55.5, -10.7, -5.9], CZ: [48.5, 51.1, 12, 19],
  PL: [49, 55, 14, 24.2], HU: [45.7, 48.6, 16.1, 22.9], EE: [57.5, 59.8, 21.7, 28.3], CA: [41, 84, -141, -52],
  AU: [-44, -10, 112, 154], NZ: [-47.5, -34, 166, 179], JP: [24, 46, 122, 146], KR: [33, 39, 124.5, 131], SG: [1.1, 1.5, 103.6, 104.1],
  MY: [0.8, 7.5, 99.6, 119.3], TR: [35.8, 42.2, 25.6, 44.9], AE: [22.5, 26.1, 51.5, 56.4], RU: [41, 82, 19, 180],
}
const insideCountry = (country, lat, lon) => {
  const box = countryBounds[country]
  return !box || (lat >= box[0] && lat <= box[1] && lon >= box[2] && lon <= box[3])
}

const yearOf = (claim) => Number(claim?.mainsnak?.datavalue?.value?.time?.match(/^[+-](\d{4})/)?.[1]) || null
const latestQuantity = (claims = []) => {
  const values = claims
    .filter(claim => claim.rank !== 'deprecated' && claim.mainsnak?.datavalue?.value?.amount)
    .map(claim => ({
      amount: Number(claim.mainsnak.datavalue.value.amount),
      year: yearOf({ mainsnak: claim.qualifiers?.P585?.[0] }) || 0,
      preferred: claim.rank === 'preferred',
    }))
    .sort((a, b) => Number(b.preferred) - Number(a.preferred) || b.year - a.year)
  return values[0]?.amount || null
}

const imageInfo = async (fileTitles) => {
  const info = new Map()
  for (const batch of chunks([...new Set(fileTitles)], 50)) {
    const data = await commons({ prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '1280', titles: batch.join('|') })
    const titles = resolveTitles(data, batch)
    const pages = new Map((data.query?.pages || []).map(page => [page.title, page]))
    for (const title of batch) {
      const image = pages.get(titles.get(title))?.imageinfo?.[0]
      if (image) info.set(title, image)
    }
    await sleep(150)
  }
  return info
}

const enrichFromWiki = async (records, enrichment) => {
  const withWiki = records.filter(record => record.wiki)
  const pageOf = new Map()
  const langOf = new Map(withWiki.map(record => [record.slug, wikiRef(record.wiki).lang]))
  for (const lang of new Set(langOf.values())) {
    for (const batch of chunks(withWiki.filter(record => langOf.get(record.slug) === lang), 40)) {
      const titles = batch.map(record => wikiRef(record.wiki).title)
      const data = await wikipedia(lang, { redirects: '1', prop: 'pageprops|coordinates|pageimages', ppprop: 'wikibase_item', piprop: 'thumbnail', pithumbsize: '640', titles: titles.join('|') })
      const resolved = resolveTitles(data, titles)
      const pages = new Map((data.query?.pages || []).map(page => [page.title, page]))
      for (const record of batch) {
        const page = pages.get(resolved.get(wikiRef(record.wiki).title))
        if (page && !page.missing) pageOf.set(record.slug, page)
      }
      await sleep(150)
    }
  }

  const items = [...new Set([...pageOf.values()].map(page => page.pageprops?.wikibase_item).filter(Boolean))]
  const entities = {}
  for (const batch of chunks(items, 50)) {
    const data = await wikidata({ action: 'wbgetentities', ids: batch.join('|'), props: 'claims|labels', languages: 'kk|ru|en' })
    Object.assign(entities, data.entities)
    await sleep(150)
  }

  // Фото со страницы статьи: берём только JPEG-снимки, без логотипов и карт.
  const articleImages = new Map()
  for (const lang of new Set(langOf.values())) {
    for (const batch of chunks([...pageOf.entries()].filter(([slug]) => langOf.get(slug) === lang), 10)) {
      let cont = {}
      do {
        const data = await wikipedia(lang, { prop: 'images', imlimit: 'max', titles: batch.map(([, page]) => page.title).join('|'), ...cont })
        for (const page of data.query?.pages || []) {
          const slug = batch.find(([, item]) => item.title === page.title)?.[0]
          if (!slug) continue
          const list = articleImages.get(slug) || []
          list.push(...(page.images || []).map(image => image.title).filter(isPhoto).map(commonsTitle))
          articleImages.set(slug, list)
        }
        cont = data.continue || null
        await sleep(150)
      } while (cont)
    }
  }

  const p18 = new Map()
  for (const [slug, page] of pageOf) {
    const file = entities[page.pageprops?.wikibase_item]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    if (file && isPhoto(file)) p18.set(slug, `File:${file.replace(/_/g, ' ')}`)
  }
  const info = await imageInfo([...p18.values(), ...[...articleImages.values()].flat()])
  const suitable = (title) => {
    const image = info.get(title)
    if (!image?.thumburl || image.mime !== 'image/jpeg') return false
    const aspect = image.width / image.height
    return image.width >= 1000 && image.height >= 560 && aspect >= 1.2 && aspect <= 2.4
  }
  const galleryItem = (title) => ({ url: info.get(title).thumburl, source: info.get(title).descriptionurl })
  const wrongCountry = []

  for (const record of withWiki) {
    const entry = (enrichment[record.slug] ||= {})
    for (const key of ['wikidata', 'wikipedia', 'founded', 'students', 'lat', 'lon', 'nameKk', 'cover', 'gallery', 'imageSource', 'officialWebsite']) delete entry[key]
    const page = pageOf.get(record.slug)
    if (!page) continue
    const pageCoords = page.coordinates?.[0]
    if (pageCoords && !insideCountry(record.country, pageCoords.lat, pageCoords.lon)) {
      wrongCountry.push(`${record.slug}: "${page.title}" is at ${pageCoords.lat.toFixed(1)}, ${pageCoords.lon.toFixed(1)}`)
      continue
    }
    const entity = entities[page.pageprops?.wikibase_item]
    const claims = entity?.claims || {}
    const coords = page.coordinates?.[0] || claims.P625?.[0]?.mainsnak?.datavalue?.value
    entry.wikipedia = `https://${langOf.get(record.slug)}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`
    if (entity) entry.wikidata = entity.id
    entry.founded = yearOf(claims.P571?.[0])
    entry.students = latestQuantity(claims.P2196)
    if (coords) Object.assign(entry, { lat: Number(coords.lat ?? coords.latitude), lon: Number(coords.lon ?? coords.longitude) })
    const kk = entity?.labels?.kk?.value
    if (kk && /[а-яәіңғүұқөһ]/i.test(kk)) entry.nameKk = kk
    entry.officialWebsite = claims.P856?.[0]?.mainsnak?.datavalue?.value || undefined
    if (page.thumbnail?.source) entry.imageSource = page.thumbnail.source

    const titles = [...new Set([p18.get(record.slug), ...(articleImages.get(record.slug) || [])].filter(Boolean))].filter(suitable)
    const gallery = titles.slice(0, 6).map(galleryItem)
    if (gallery.length) {
      entry.cover = gallery[0].url
      entry.gallery = gallery
    }
    for (const key of Object.keys(entry)) if (entry[key] === null || entry[key] === undefined) delete entry[key]
  }

  if (wrongCountry.length) console.log(`Skipped, article is about a place in another country:\n  ${wrongCountry.join('\n  ')}`)
  const withPhotos = withWiki.filter(record => enrichment[record.slug]?.cover).length
  console.log(`Wikipedia/Wikidata: ${pageOf.size} of ${withWiki.length} articles found, ${withPhotos} with campus photos.`)
  const notFound = withWiki.filter(record => !pageOf.has(record.slug)).map(record => `${record.slug} (${record.wiki})`)
  if (notFound.length) console.log(`Articles not found:\n  ${notFound.join('\n  ')}`)

  const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } }
  const websiteDiffs = withWiki
    .filter(record => enrichment[record.slug]?.officialWebsite)
    .filter(record => {
      const ours = host(record.website)
      const theirs = host(enrichment[record.slug].officialWebsite)
      return ours && theirs && ours !== theirs && !ours.endsWith(`.${theirs}`) && !theirs.endsWith(`.${ours}`)
    })
    .map(record => `${record.slug}: ${record.website} vs Wikidata ${enrichment[record.slug].officialWebsite}`)
  if (websiteDiffs.length) console.log(`Website differs from Wikidata (check manually):\n  ${websiteDiffs.join('\n  ')}`)
}

const enrichment = await readEnrichment()
const records = await loadCatalog({ enrichment: {} })
if (!only || only === 'qs') await matchQs(records, enrichment)
if (!only || only === 'wiki') await enrichFromWiki(records, enrichment)

const known = new Set(records.map(record => record.slug))
const sorted = Object.fromEntries(Object.keys(enrichment).filter(slug => known.has(slug)).sort().map(slug => [slug, enrichment[slug]]))
await writeFile(enrichmentPath, `${JSON.stringify(sorted, null, 1)}\n`)
console.log(`Saved ${enrichmentPath}`)
