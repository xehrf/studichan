import { closeDb, initDb, withTransaction } from '../db.mjs'
import { getCitySafety } from '../city-safety.mjs'
import { loadCatalog } from './catalog.mjs'
import { toKzt } from '../src/catalog-config.js'

const universities = await loadCatalog()

const requirementsText = (requirements) => Object.entries(requirements).map(([key, value]) => `${key}: ${value}`).join('; ')

try {
  await initDb()
  await withTransaction(async (client) => {
    await client.query("DELETE FROM universities WHERE website LIKE '%example.com%'")
    for (const university of universities) {
      const safety = university.country === 'CN' ? getCitySafety(university.city.ru) : { level: 'not_rated', description: '' }
      const tuition = university.tuition
      // Строки, созданные прежним сидом, ещё без slug: привязываем их по имени,
      // чтобы сохранить id и связанные заявки.
      await client.query('UPDATE universities SET slug = $1 WHERE slug IS NULL AND name = $2', [university.slug, university.dbName])
      await client.query(`
        INSERT INTO universities (
          slug, name, country, city, city_translations, region, ranking, ranking_world, ranking_world_label,
          university_type, specialties, requirements, admission_requirements, tuition, tuition_currency,
          tuition_min_local, tuition_max_local, tuition_min_kzt, tuition_max_kzt, description, website, source_url,
          verified_at, name_translations, name_local, description_translations, specialties_translations,
          requirements_translations, tuition_translations, image_url, image_source, image_gallery, data_status,
          data_checked_at, city_safety, city_safety_description, has_csc_scholarship, scholarships, languages,
          founded, students_count, latitude, longitude, wikipedia_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, '', $20, $20,
          NULL, $21, $22, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, $23, $24, $25, 'requires_verification',
          NULL, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name, country = EXCLUDED.country, city = EXCLUDED.city,
          city_translations = EXCLUDED.city_translations, region = EXCLUDED.region, ranking = EXCLUDED.ranking,
          ranking_world = EXCLUDED.ranking_world, ranking_world_label = EXCLUDED.ranking_world_label,
          university_type = EXCLUDED.university_type, specialties = EXCLUDED.specialties,
          requirements = EXCLUDED.requirements, admission_requirements = EXCLUDED.admission_requirements,
          tuition = EXCLUDED.tuition, tuition_currency = EXCLUDED.tuition_currency,
          tuition_min_local = EXCLUDED.tuition_min_local, tuition_max_local = EXCLUDED.tuition_max_local,
          tuition_min_kzt = EXCLUDED.tuition_min_kzt, tuition_max_kzt = EXCLUDED.tuition_max_kzt,
          description = EXCLUDED.description, website = EXCLUDED.website, source_url = EXCLUDED.source_url,
          verified_at = NULL, name_translations = EXCLUDED.name_translations, name_local = EXCLUDED.name_local,
          description_translations = EXCLUDED.description_translations,
          specialties_translations = EXCLUDED.specialties_translations,
          requirements_translations = EXCLUDED.requirements_translations,
          tuition_translations = EXCLUDED.tuition_translations,
          image_url = EXCLUDED.image_url, image_source = EXCLUDED.image_source,
          data_status = EXCLUDED.data_status, data_checked_at = EXCLUDED.data_checked_at,
          city_safety = EXCLUDED.city_safety, city_safety_description = EXCLUDED.city_safety_description,
          has_csc_scholarship = EXCLUDED.has_csc_scholarship, scholarships = EXCLUDED.scholarships,
          languages = EXCLUDED.languages, founded = EXCLUDED.founded, students_count = EXCLUDED.students_count,
          latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, wikipedia_url = EXCLUDED.wikipedia_url,
          -- Галерею с официальных сайтов (npm run sync:images) не затираем одной обложкой.
          image_gallery = CASE
            WHEN jsonb_array_length(EXCLUDED.image_gallery) > 1 OR universities.image_gallery = '[]'::jsonb
            THEN EXCLUDED.image_gallery
            ELSE universities.image_gallery
          END
      `, [
        university.slug, university.dbName, university.country, university.city.ru,
        JSON.stringify(university.city), university.region || university.country, university.rankingNational,
        university.rankingWorld, university.rankingWorldLabel, university.type, university.specialties.join(', '),
        requirementsText(university.requirements), JSON.stringify(university.requirements),
        tuition ? `${tuition.min}–${tuition.max} ${tuition.currency}` : '', tuition?.currency || null,
        tuition?.min ?? null, tuition?.max ?? null, tuition ? toKzt(tuition.min, tuition.currency) : null,
        tuition ? toKzt(tuition.max, tuition.currency) : null, university.website,
        JSON.stringify(university.names), university.nameLocal, university.cover, university.imageSource,
        JSON.stringify(university.gallery), safety.level, safety.description,
        university.scholarships.includes('csc'), JSON.stringify(university.scholarships),
        JSON.stringify(university.languages), university.founded, university.students || 0,
        university.latitude, university.longitude, university.wikipedia || null,
      ])
    }
  })
  console.log(`Seeded ${universities.length} universities.`)
} finally {
  await closeDb()
}
