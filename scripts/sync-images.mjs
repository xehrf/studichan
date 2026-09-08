import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeDb, initDb, withTransaction } from '../db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '..', 'prisma', 'data', 'universities.json')
const universities = JSON.parse(await readFile(dataPath, 'utf8')).filter(item => item.nameEn && item.website)
const delayMs = Number(process.env.IMAGE_SYNC_DELAY_MS || 800)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const findImages = async (name) => {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `${name} university campus`,
    gsrnamespace: '6', gsrlimit: '4', prop: 'imageinfo', iiprop: 'url',
    iiurlwidth: '1200', format: 'json', origin: '*',
  })
  try {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
    if (!response.ok) return []
    const data = await response.json()
    return Object.values(data.query?.pages || {}).map(page => {
      const info = page?.imageinfo?.[0]
      return info?.thumburl ? { url: info.thumburl, source: info.descriptionurl || info.url } : null
    }).filter(Boolean)
  } catch (error) {
    console.warn(`Skipped ${name}: ${error.message}`)
    return []
  }
}

await initDb()
try {
  await withTransaction(async (client) => {
    for (const university of universities) {
      const images = await findImages(university.nameEn)
      if (images.length) {
        await client.query(`
          UPDATE universities
          SET image_url = $1, image_source = $2, image_gallery = $3
          WHERE name = $4
        `, [images[0].url, images[0].source, JSON.stringify(images), university.nameEn])
        console.log(`${university.nameEn}: ${images.length} image(s)`)
      } else {
        console.log(`${university.nameEn}: no images found`)
      }
      await sleep(delayMs)
    }
  })
} finally {
  await closeDb()
}
