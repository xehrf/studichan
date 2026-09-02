import { closeDb, initDb, withTransaction } from '../db.mjs'

const universities = [
  ['Tsinghua University', 'Beijing', 'North', 1, 'Engineering, Computer Science, Business', 'HSK 4+, Bachelor degree', '$3000-5000 per year', 'Top ranked university in China', 'https://www.tsinghua.edu.cn/en/', 'https://www.tsinghua.edu.cn/en/'],
  ['Peking University', 'Beijing', 'North', 2, 'Law, Medicine, Liberal Arts', 'HSK 5+, Bachelor degree', '$3500-6000 per year', 'Prestigious research university', 'https://english.pku.edu.cn/', 'https://english.pku.edu.cn/'],
  ['Fudan University', 'Shanghai', 'East', 3, 'Business, Economics, Medicine', 'HSK 4+, Bachelor degree', '$3000-5500 per year', 'Leading university in China', 'https://www.fudan.edu.cn/en/', 'https://www.fudan.edu.cn/en/'],
  ['Shanghai Jiao Tong University', 'Shanghai', 'East', 4, 'Engineering, Computer Science', 'HSK 4+, Bachelor degree', '$2800-4800 per year', 'Elite engineering university', 'https://en.sjtu.edu.cn/', 'https://en.sjtu.edu.cn/'],
]

try {
  await initDb()
  await withTransaction(async (client) => {
    for (const university of universities) {
      await client.query(`
        INSERT INTO universities (name, city, region, ranking, specialties, requirements, tuition, description, website, source_url, verified_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)
        ON CONFLICT (name) DO UPDATE SET
          city = EXCLUDED.city, region = EXCLUDED.region, ranking = EXCLUDED.ranking,
          specialties = EXCLUDED.specialties, requirements = EXCLUDED.requirements,
          tuition = EXCLUDED.tuition, description = EXCLUDED.description,
          website = EXCLUDED.website, source_url = EXCLUDED.source_url, verified_at = CURRENT_DATE
      `, university)
    }
  })
  console.log(`Seeded ${universities.length} universities.`)
} finally {
  await closeDb()
}
