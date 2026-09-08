import { closeDb, initDb, withTransaction } from '../db.mjs'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '..', 'prisma', 'data', 'universities.json')
const regionByProvince = {
  Пекин: 'North', Тяньцзинь: 'North', Хэбэй: 'North', Шаньси: 'North',
  'ВнутренняяМонголия': 'North', Ляонин: 'North', Цзилинь: 'North', Хэйлунцзян: 'North',
  Шанхай: 'East', Цзянсу: 'East', Чжэцзян: 'East', Аньхой: 'East', Фуцзянь: 'East',
  Цзянси: 'East', Шаньдун: 'East',
  Хэнань: 'Central', Хубэй: 'Central', Хунань: 'Central', Гуандун: 'South',
  Гуанси: 'South', Хайнань: 'South', Чунцин: 'West', Сычуань: 'West', Гуйчжоу: 'West',
  Юньнань: 'West', Тибет: 'West', Шэньси: 'West', Ганьсу: 'West', Цинхай: 'West',
  Нинся: 'West', Синьцзян: 'West',
}

const regionFor = (university) => {
  const province = university.province.replace(/\s+/g, '')
  return regionByProvince[province] || 'Central'
}

const specialtyTranslations = {
  engineering: ['Engineering', 'инженерия', 'инженерия'],
  'computer science': ['Computer Science', 'компьютерные науки', 'компьютерлік ғылымдар'],
  architecture: ['Architecture', 'архитектура', 'сәулет'],
  medicine: ['Medicine', 'медицина', 'медицина'],
  economics: ['Economics', 'экономика', 'экономика'],
  business: ['Business and Management', 'бизнес и менеджмент', 'бизнес және менеджмент'],
  law: ['Law', 'право', 'құқық'],
  humanities: ['Humanities', 'гуманитарные науки', 'гуманитарлық ғылымдар'],
  science: ['Natural Sciences', 'естественные науки', 'жаратылыстану ғылымдары'],
  education: ['Education', 'педагогика', 'педагогика'],
  agriculture: ['Agriculture', 'сельское хозяйство', 'ауыл шаруашылығы'],
  materials: ['Materials Science', 'материаловедение', 'материалтану'],
  chemistry: ['Chemistry', 'химия', 'химия'],
}

const translateSpecialties = (value) => {
  const aliases = {
    engineering: ['engineering', 'инженерия', 'строительство', 'автоматизация', 'энергетика', 'транспорт'],
    'computer science': ['computer science', 'информатика', 'телекоммуникации', 'кибербезопасность', 'искусственный интеллект'],
    architecture: ['architecture', 'архитектура'],
    medicine: ['medicine', 'медицина', 'стоматология', 'фармацевтика', 'офтальмология'],
    economics: ['economics', 'экономика', 'финансы', 'страхование', 'бухгалтерский учет'],
    business: ['business', 'менеджмент', 'торговля', 'бизнес'],
    law: ['law', 'право', 'криминология'],
    humanities: ['humanities', 'гуманитарные', 'история', 'философия', 'этнология', 'языки'],
    science: ['science', 'физика', 'химия', 'математика', 'биология', 'геология', 'география', 'экология'],
    education: ['education', 'образование', 'педагогика', 'психология'],
    agriculture: ['agriculture', 'сельское хозяйство', 'агрономия', 'ветеринария', 'лесное хозяйство'],
    materials: ['materials', 'материалы', 'материаловедение', 'металлургия'],
    chemistry: ['chemistry', 'химия', 'биоинженерия'],
  }
  const lowerValue = value.toLowerCase()
  const selected = Object.entries(aliases)
    .filter(([, words]) => words.some((word) => lowerValue.includes(word)))
    .map(([key]) => key)
  const fallback = selected.length ? selected : ['engineering', 'science']
  return {
    en: fallback.map((key) => specialtyTranslations[key][0]).join(', '),
    ru: fallback.map((key) => specialtyTranslations[key][1]).join(', '),
    kk: fallback.map((key) => specialtyTranslations[key][2]).join(', '),
  }
}

const descriptionTranslations = (university, specialties) => ({
  en: `${university.nameEn} is a public university in ${university.city}, China. Its main academic areas include ${specialties.en}.`,
  ru: `${university.nameRu} — государственный университет Китая в городе ${university.city}. Основные направления подготовки: ${specialties.ru}.`,
  kk: `${university.nameRu} — Қытайдың ${university.city} қаласындағы мемлекеттік университеті. Негізгі білім беру бағыттары: ${specialties.kk}.`,
})

const preliminaryAdmissions = (university) => {
  const name = university.nameEn
  const premium = {
    'Peking University': ['1 794 000–3 105 000 ₸', 'HSK 5–6', 'IELTS н/д', 'TOEFL 100+'],
    'Tsinghua University': ['1 794 000–2 070 000 ₸', 'HSK 5 (4→5)', 'IELTS н/д', 'TOEFL н/д'],
    'Fudan University': ['3 450 000–4 830 000 ₸', 'HSK н/д', 'IELTS 6.5+', 'TOEFL 90+'],
    'Shanghai Jiao Tong University': ['1 711 200+ ₸', 'HSK 5', 'IELTS 6.0+', 'TOEFL 90+'],
    'Nanjing University': ['1 449 000–3 726 000 ₸', 'HSK 5 (180+)', 'IELTS 6.0', 'TOEFL 85'],
    'Zhejiang University': ['1 380 000–3 105 000 ₸', 'HSK 4–5', 'IELTS 6.5+', 'TOEFL 80+'],
    'University of Science and Technology of China': ['1 794 000+ ₸', 'HSK 5 (мин.4)', 'IELTS н/д', 'TOEFL н/д'],
    "Xi'an Jiaotong University": ['1 380 000–3 450 000 ₸', 'HSK 4+', 'IELTS 6.0', 'TOEFL 80'],
    'Harbin Institute of Technology': ['1 794 000–2 898 000 ₸', 'HSK 4+', 'IELTS 6.0', 'TOEFL 80'],
  }
  const is985 = ['Beijing Institute of Technology', 'China Agricultural University', 'Beijing Normal University',
    'Tongji University', 'East China Normal University', 'Southeast University', 'Huazhong University of Science and Technology',
    'Tianjin University', 'Sun Yat-sen University', 'Shandong University', 'Sichuan University', 'South China University of Technology',
    'Hunan University', 'Central South University', 'Dalian University of Technology', 'Northeastern University',
    'Nankai University', 'Jilin University', 'Ocean University of China', 'Chongqing University', 'Xiamen University'].includes(name)
  const tuition = premium[name]?.[0] || (is985 ? '1 380 000–2 760 000 ₸' : '1 242 000–2 070 000 ₸')
  const requirements = premium[name]?.slice(1) || (is985
    ? ['HSK 4–5', 'IELTS 6.0–6.5', 'TOEFL 80–90']
    : ['HSK 4', 'IELTS 5.5–6.0', 'TOEFL 70–80'])
  return {
    tuition,
    requirements: `HSK: ${requirements[0]}; IELTS: ${requirements[1]}; TOEFL: ${requirements[2]}`,
    ruRequirements: `HSK: ${requirements[0]}; IELTS: ${requirements[1]}; TOEFL: ${requirements[2]}`,
    kkRequirements: `HSK: ${requirements[0]}; IELTS: ${requirements[1]}; TOEFL: ${requirements[2]}`,
    ruTuition: `Стоимость обучения: ${tuition}.`,
    kkTuition: `Оқу ақысы: ${tuition}.`,
  }
}

const universities = JSON.parse(await readFile(dataPath, 'utf8')).filter((university) => (
  !university.website.includes('example.com')
))

try {
  await initDb()
  await withTransaction(async (client) => {
    await client.query("DELETE FROM universities WHERE website LIKE '%example.com%'")
    for (const university of universities) {
      const specialties = university.specialties || university.description.match(/Сильные стороны вуза: ([^.]+)\./)?.[1] || ''
      const translatedSpecialties = translateSpecialties(specialties)
      const translatedDescription = descriptionTranslations(university, translatedSpecialties)
      const admissions = preliminaryAdmissions(university)
      await client.query(`
        INSERT INTO universities (
          name, city, city_safety, region, ranking, specialties, requirements, tuition, description,
          website, source_url, verified_at, name_translations, description_translations,
          specialties_translations, requirements_translations, tuition_translations,
          image_url, image_source, data_status, data_checked_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, NULL, $11, $12, $13, $14, $15, $16, $17, 'requires_verification', NULL)
        ON CONFLICT (name) DO UPDATE SET
          city = EXCLUDED.city, region = EXCLUDED.region, ranking = EXCLUDED.ranking,
          specialties = EXCLUDED.specialties, requirements = EXCLUDED.requirements,
          tuition = EXCLUDED.tuition, description = EXCLUDED.description,
          website = EXCLUDED.website, source_url = EXCLUDED.source_url,
          verified_at = NULL, name_translations = EXCLUDED.name_translations,
          description_translations = EXCLUDED.description_translations,
          specialties_translations = EXCLUDED.specialties_translations,
          requirements_translations = EXCLUDED.requirements_translations,
          tuition_translations = EXCLUDED.tuition_translations,
          image_url = EXCLUDED.image_url, image_source = EXCLUDED.image_source,
          data_status = EXCLUDED.data_status, data_checked_at = EXCLUDED.data_checked_at
      `, [
        university.nameEn, university.city, university.citySafety || 'not_rated', regionFor(university), university.rankingNational,
        translatedSpecialties.en, admissions.requirements, admissions.tuition, translatedDescription.en, university.website,
        JSON.stringify({ en: university.nameEn, ru: university.nameRu, kk: university.nameRu }),
        JSON.stringify(translatedDescription), JSON.stringify(translatedSpecialties),
        JSON.stringify({ en: admissions.requirements, ru: admissions.ruRequirements, kk: admissions.kkRequirements }),
        JSON.stringify({ en: admissions.tuition, ru: admissions.ruTuition, kk: admissions.kkTuition }),
        university.coverUrl, university.logoUrl,
      ])
    }
  })
  console.log(`Seeded ${universities.length} universities from ${dataPath}.`)
} finally {
  await closeDb()
}
