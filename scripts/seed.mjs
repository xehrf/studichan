import { closeDb, initDb, withTransaction } from '../db.mjs'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '..', 'prisma', 'data', 'universities.json')
const regionByProvince = {
  Beijing: 'North', Tianjin: 'North', Hebei: 'North', Shanxi: 'North',
  InnerMongolia: 'North', Liaoning: 'North', Jilin: 'North', Heilongjiang: 'North',
  Shanghai: 'East', Jiangsu: 'East', Zhejiang: 'East', Anhui: 'East', Fujian: 'East',
  Jiangxi: 'East', Shandong: 'East',
  Henan: 'Central', Hubei: 'Central', Hunan: 'Central', Guangdong: 'South',
  Guangxi: 'South', Hainan: 'South', Chongqing: 'West', Sichuan: 'West', Guizhou: 'West',
  Yunnan: 'West', Tibet: 'West', Shaanxi: 'West', Gansu: 'West', Qinghai: 'West',
  Ningxia: 'West', Xinjiang: 'West',
}

const regionFor = (university) => {
  const province = university.province.replace(/\s+/g, '')
  return regionByProvince[province] || 'Central'
}

const jsonTranslations = (value) => JSON.stringify({ en: value, ru: value, kk: value })

const universities = JSON.parse(await readFile(dataPath, 'utf8'))

try {
  await initDb()
  await withTransaction(async (client) => {
    for (const university of universities) {
      const specialties = university.description.match(/Сильные стороны вуза: ([^.]+)\./)?.[1] || ''
      await client.query(`
        INSERT INTO universities (
          name, city, region, ranking, specialties, requirements, tuition, description,
          website, source_url, verified_at, name_translations, description_translations,
          specialties_translations, requirements_translations, tuition_translations,
          image_url, image_source
        ) VALUES ($1, $2, $3, $4, $5, '', '', $6, $7, $7, CURRENT_DATE, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (name) DO UPDATE SET
          city = EXCLUDED.city, region = EXCLUDED.region, ranking = EXCLUDED.ranking,
          specialties = EXCLUDED.specialties, description = EXCLUDED.description,
          website = EXCLUDED.website, source_url = EXCLUDED.source_url,
          verified_at = CURRENT_DATE, name_translations = EXCLUDED.name_translations,
          description_translations = EXCLUDED.description_translations,
          specialties_translations = EXCLUDED.specialties_translations,
          requirements_translations = EXCLUDED.requirements_translations,
          tuition_translations = EXCLUDED.tuition_translations,
          image_url = EXCLUDED.image_url, image_source = EXCLUDED.image_source
      `, [
        university.nameEn, university.city, regionFor(university), university.rankingNational,
        specialties, university.description, university.website,
        JSON.stringify({ en: university.nameEn, ru: university.nameRu, kk: university.nameRu }),
        JSON.stringify({ en: university.description, ru: university.description, kk: university.description }),
        jsonTranslations(specialties), '{}', '{}', university.coverUrl, university.logoUrl,
      ])
    }
  })
  console.log(`Seeded ${universities.length} universities from ${dataPath}.`)
} finally {
  await closeDb()
}
