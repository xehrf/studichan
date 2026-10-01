// Загрузка каталога вузов из prisma/data в единый формат.
//
// Источники:
// - prisma/data/universities.json — исходный китайский каталог (старый формат);
// - prisma/data/catalog/*.json — вузы остальных стран и новые китайские вузы;
// - prisma/data/enrichment.json — данные, собранные `npm run enrich:universities`
//   (места QS, фото, координаты, год основания, число студентов).
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { COUNTRIES, SPECIALTIES, SCHOLARSHIPS } from '../src/catalog-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const dataDir = path.join(__dirname, '..', 'prisma', 'data')
export const enrichmentPath = path.join(dataDir, 'enrichment.json')

const regionByProvince = {
  Пекин: 'North', Тяньцзинь: 'North', Хэбэй: 'North', Шаньси: 'North',
  ВнутренняяМонголия: 'North', Ляонин: 'North', Цзилинь: 'North', Хэйлунцзян: 'North',
  Шанхай: 'East', Цзянсу: 'East', Чжэцзян: 'East', Аньхой: 'East', Фуцзянь: 'East',
  Цзянси: 'East', Шаньдун: 'East',
  Хэнань: 'Central', Хубэй: 'Central', Хунань: 'Central', Гуандун: 'South',
  Гуанси: 'South', Хайнань: 'South', Чунцин: 'West', Сычуань: 'West', Гуйчжоу: 'West',
  Юньнань: 'West', Тибет: 'West', Шэньси: 'West', Ганьсу: 'West', Цинхай: 'West',
  Нинся: 'West', Синьцзян: 'West',
}

// В исходном китайском каталоге города записаны только по-русски.
const chineseCityEn = {
  Пекин: 'Beijing', Шанхай: 'Shanghai', Ханчжоу: 'Hangzhou', Хэфэй: 'Hefei', Нанкин: 'Nanjing',
  Ухань: 'Wuhan', Харбин: 'Harbin', Тяньцзинь: 'Tianjin', Гуанчжоу: 'Guangzhou', Сиань: "Xi'an",
  Цзинань: 'Jinan', Сямынь: 'Xiamen', Чэнду: 'Chengdu', Циндао: 'Qingdao', Сюйчжоу: 'Xuzhou',
  Далянь: 'Dalian', Шэньян: 'Shenyang', Чанчунь: 'Changchun', Ланьчжоу: 'Lanzhou', Янлин: 'Yangling',
  Чунцин: 'Chongqing', Чанша: 'Changsha', Чжэнчжоу: 'Zhengzhou', Кайфын: 'Kaifeng', Нинбо: 'Ningbo',
  Сучжоу: 'Suzhou', Фучжоу: 'Fuzhou', Шэньчжэнь: 'Shenzhen', Куньмин: 'Kunming', Гуйян: 'Guiyang',
  Наньнин: 'Nanning', Хайкоу: 'Haikou', Лхаса: 'Lhasa', 'Хух-Хото': 'Hohhot', Урумчи: 'Ürümqi',
  Иньчуань: 'Yinchuan', Синин: 'Xining', Тайюань: 'Taiyuan', Баодин: 'Baoding',
  Циньхуандао: 'Qinhuangdao', Наньчан: 'Nanchang', Вэньчжоу: 'Wenzhou',
}
const cityKk = { Пекин: 'Бейжің', Урумчи: 'Үрімжі', Москва: 'Мәскеу', Лондон: 'Лондон' }

// Ключевые слова русских описаний направлений → ключи из SPECIALTIES.
const specialtyAliases = {
  cs: ['информатика', 'компьютерные науки', 'телекоммуникации', 'кибербезопасность', 'искусственный интеллект', 'связь', 'электроника', 'радар'],
  engineering: ['инженерия', 'строительство', 'автоматизация', 'энергетика', 'транспорт', 'материал', 'металлургия', 'робототехника', 'техника', 'механика', 'горное дело', 'оптика', 'кораблестроение', 'гидротехника', 'текстиль', 'химическая технология', 'автомобили'],
  medicine: ['медицина', 'стоматология', 'фармац', 'офтальмология', 'здоровье', 'фармакология', 'реабилитация', 'биомедицина'],
  business: ['менеджмент', 'торговля', 'бизнес', 'логистика', 'туризм', 'бухгалтерский', 'страхование', 'государственное управление'],
  economics: ['экономика', 'финансы', 'статистика'],
  law: ['право', 'криминология'],
  social: ['международные отношения', 'политология', 'журналистика', 'социология', 'социальные науки', 'медиакоммуникации', 'телевидение'],
  languages: ['языки', 'язык', 'перевод'],
  humanities: ['гуманитарные', 'история', 'философия', 'этнология', 'археология', 'тибет', 'монголоведение'],
  science: ['естественные науки', 'физика', 'химия', 'математика', 'биология', 'геология', 'география', 'экология', 'океанология', 'астрономия', 'геофизика', 'геодезия', 'биотехнолог', 'биоинженерия', 'пищевые науки', 'ресурсы'],
  education: ['образование', 'педагогика', 'психология'],
  agriculture: ['сельское хозяйство', 'агрономия', 'ветеринария', 'лесное хозяйство', 'рыбное хозяйство'],
  architecture: ['архитектура', 'дизайн'],
  arts: ['искусств', 'музыка', 'кино', 'исполнительское'],
}

const legacySpecialties = (text) => {
  const lower = String(text || '').toLowerCase()
  const keys = SPECIALTIES.filter(key => specialtyAliases[key].some(word => lower.includes(word)))
  return keys.length ? keys : ['engineering', 'science']
}

// Ориентировочная стоимость и требования для исходного китайского каталога
// (CNY в год). Раньше эти суммы хранились сразу в тенге по курсу 69 ₸.
const premiumChina = {
  'Peking University': [[26000, 45000], { HSK: '5–6', TOEFL: '100+' }],
  'Tsinghua University': [[26000, 30000], { HSK: '5' }],
  'Fudan University': [[50000, 70000], { IELTS: '6.5+', TOEFL: '90+' }],
  'Shanghai Jiao Tong University': [[24800, 32000], { HSK: '5', IELTS: '6.0+', TOEFL: '90+' }],
  'Nanjing University': [[21000, 54000], { HSK: '5', IELTS: '6.0+', TOEFL: '85+' }],
  'Zhejiang University': [[20000, 45000], { HSK: '4–5', IELTS: '6.5+', TOEFL: '80+' }],
  'University of Science and Technology of China': [[26000, 32000], { HSK: '5' }],
  "Xi'an Jiaotong University": [[20000, 50000], { HSK: '4+', IELTS: '6.0+', TOEFL: '80+' }],
  'Harbin Institute of Technology': [[26000, 42000], { HSK: '4+', IELTS: '6.0+', TOEFL: '80+' }],
}
const project985 = new Set(['Beijing Institute of Technology', 'China Agricultural University', 'Beijing Normal University',
  'Tongji University', 'East China Normal University', 'Southeast University', 'Huazhong University of Science and Technology',
  'Tianjin University', 'Sun Yat-sen University', 'Shandong University', 'Sichuan University', 'South China University of Technology',
  'Hunan University', 'Central South University', 'Dalian University of Technology', 'Northeastern University',
  'Nankai University', 'Jilin University', 'Ocean University of China', 'Chongqing University', 'Xiamen University'])

const legacyAdmissions = (nameEn) => {
  if (premiumChina[nameEn]) return premiumChina[nameEn]
  if (project985.has(nameEn)) return [[20000, 40000], { HSK: '4–5', IELTS: '6.0–6.5', TOEFL: '80–90' }]
  return [[18000, 30000], { HSK: '4', IELTS: '5.5–6.0', TOEFL: '70–80' }]
}

// Названия исходного каталога, которые в QS или английской Википедии записаны
// иначе либо совпадают с другим вузом (Northeastern University — это и Шэньян,
// и Бостон; Southwestern University — колледж в Техасе).
const legacyOverrides = {
  'Southeast University': { qs: 'Southeast University, China' },
  'Beijing University of Aeronautics and Astronautics': { qs: 'Beihang University (former BUAA)', wiki: 'Beihang University' },
  'Northwest A&F University': { qs: 'Northwest Agriculture and Forestry University' },
  'Southwestern University': { qs: 'Southwest University', wiki: 'Southwest University' },
  'Northeastern University': { wiki: 'Northeastern University (China)' },
  'Northwest University': { wiki: 'Northwest University (China)' },
  'China Medical University': { wiki: 'China Medical University (PRC)' },
  'China University of Petroleum': { wiki: 'China University of Petroleum (East China)' },
}

const fromLegacy = (university) => {
  const [[min, max], requirements] = legacyAdmissions(university.nameEn)
  const override = legacyOverrides[university.nameEn] || {}
  return {
    qs: override.qs,
    wiki: override.wiki,
    slug: university.slug,
    dbName: university.nameEn,
    country: 'CN',
    nameEn: university.nameEn,
    nameRu: university.nameRu,
    nameLocal: university.nameCn,
    cityEn: chineseCityEn[university.city] || university.city,
    cityRu: university.city,
    cityKk: cityKk[university.city],
    region: regionByProvince[university.province.replace(/\s+/g, '')] || 'Central',
    type: 'public',
    website: university.website,
    specialties: legacySpecialties(university.specialties),
    tuition: [min, max, 'CNY'],
    requirements,
    scholarships: university.hasCscScholarship ? ['csc'] : [],
    rankingNational: university.rankingNational,
    coverUrl: university.coverUrl,
    logoUrl: university.logoUrl,
    galleryUrls: university.galleryUrls,
  }
}

const unique = (values) => [...new Set(values.filter(Boolean))]

const normalize = (raw, enrichment) => {
  const country = COUNTRIES[raw.country]
  if (!country) throw new Error(`${raw.slug}: unknown country ${raw.country}`)
  const extra = enrichment[raw.slug] || {}
  const specialties = unique(raw.specialties || [])
  const unknownSpecialty = specialties.find(key => !SPECIALTIES.includes(key))
  if (unknownSpecialty) throw new Error(`${raw.slug}: unknown specialty ${unknownSpecialty}`)
  const scholarships = unique([...(raw.scholarships || []), ...country.scholarships])
  const unknownScholarship = scholarships.find(key => !SCHOLARSHIPS.includes(key))
  if (unknownScholarship) throw new Error(`${raw.slug}: unknown scholarship ${unknownScholarship}`)
  const [tuitionMin, tuitionMax, currency] = raw.tuition || []
  // Элементы галереи: { url, source } — source ведёт на страницу файла на
  // Wikimedia Commons, где указаны автор и лицензия.
  const photos = raw.galleryUrls?.length > 1
    ? raw.galleryUrls.map(url => ({ url }))
    : extra.gallery || []
  const cover = raw.coverUrl || extra.cover || photos[0]?.url || null
  const gallery = []
  for (const photo of [{ url: cover, source: photos.find(item => item.url === cover)?.source }, ...photos]) {
    if (photo.url && !gallery.some(item => item.url === photo.url)) gallery.push(photo.source ? photo : { url: photo.url })
  }

  return {
    slug: raw.slug,
    dbName: raw.dbName || raw.nameEn,
    country: raw.country,
    group: country.group,
    names: { en: raw.nameEn, ru: raw.nameRu, kk: raw.nameKk || extra.nameKk || raw.nameRu },
    nameLocal: raw.nameLocal || null,
    city: { en: raw.cityEn, ru: raw.cityRu, kk: raw.cityKk || raw.cityRu },
    region: raw.region || null,
    type: raw.type === 'private' ? 'private' : 'public',
    website: raw.website,
    wiki: raw.wiki === false ? null : raw.wiki || raw.nameEn,
    qsName: raw.qs || null,
    specialties,
    tuition: raw.tuition ? { min: tuitionMin, max: tuitionMax, currency } : null,
    requirements: raw.requirements || {},
    scholarships,
    languages: raw.languages || country.languages,
    rankingNational: raw.rankingNational || null,
    rankingWorld: extra.qsRank || null,
    rankingWorldLabel: extra.qsLabel || null,
    cover,
    imageSource: raw.logoUrl || extra.imageSource || null,
    gallery,
    wikipedia: extra.wikipedia || null,
    founded: extra.founded || null,
    students: extra.students || null,
    latitude: extra.lat ?? null,
    longitude: extra.lon ?? null,
  }
}

export const readEnrichment = async () => {
  try {
    return JSON.parse(await readFile(enrichmentPath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return {}
    throw error
  }
}

export const loadCatalog = async ({ enrichment } = {}) => {
  const extra = enrichment || await readEnrichment()
  const legacy = JSON.parse(await readFile(path.join(dataDir, 'universities.json'), 'utf8'))
    .filter(university => !university.website.includes('example.com'))
    .map(fromLegacy)
  const catalogDir = path.join(dataDir, 'catalog')
  const files = (await readdir(catalogDir)).filter(file => file.endsWith('.json')).sort()
  const added = []
  for (const file of files) added.push(...JSON.parse(await readFile(path.join(catalogDir, file), 'utf8')))

  const records = [...legacy, ...added].map(raw => normalize(raw, extra))
  for (const key of ['slug', 'dbName']) {
    const seen = new Set()
    for (const record of records) {
      if (seen.has(record[key])) throw new Error(`Duplicate ${key}: ${record[key]}`)
      seen.add(record[key])
    }
  }
  return records
}
