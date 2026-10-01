import { COUNTRIES, CURRENCY_SYMBOLS } from './catalog-config.js'

export const localeTag = { en: 'en-GB', ru: 'ru-RU', kk: 'kk-KZ' }

export const localized = (translations, lang, fallback = '') => translations?.[lang] || translations?.ru || translations?.en || fallback
export const universityName = (university, lang) => localized(university.name_translations, lang, university.name)
export const cityName = (university, lang) => localized(university.city_translations, lang, university.city)
export const specialtyKeys = (university) => String(university.specialties || '').split(',').map(key => key.trim()).filter(Boolean)
export const groupOf = (university) => COUNTRIES[university.country]?.group || 'world'
export const flagOf = (country) => COUNTRIES[country]?.flag || '🎓'

// Галерея хранится как строки (старые записи) или объекты { url, source }.
export const imageList = (university) => {
  const gallery = Array.isArray(university.image_gallery) ? university.image_gallery : []
  const items = [university.image_url, ...gallery]
    .map(item => (typeof item === 'string' ? { url: item } : item))
    .filter(item => item?.url)
  const seen = new Map()
  for (const item of items) if (!seen.has(item.url) || item.source) seen.set(item.url, { ...seen.get(item.url), ...item })
  return [...seen.values()]
}

// Превью с Wikimedia: в адресе миниатюры ширина задаётся сегментом «/1280px-».
// Для карточек хватает 500px (≈40 КБ вместо ≈200 КБ).
export const thumbUrl = (url, width) => (
  url && /wikimedia\.org\/.*\/thumb\//.test(url) ? url.replace(/\/\d+px-([^/?]+)/, `/${width}px-$1`) : url
)

export const formatNumber = (value, lang) => new Intl.NumberFormat(localeTag[lang] || 'ru-RU').format(value)

// 1 900 000 → «1,9 млн ₸» / «1.9M ₸»
export const formatKzt = (value, lang) => {
  if (value === null || value === undefined) return ''
  if (value === 0) return '0 ₸'
  if (value < 1000000) return `${formatNumber(Math.round(value / 1000) * 1000, lang)} ₸`
  const millions = new Intl.NumberFormat(localeTag[lang] || 'ru-RU', { maximumFractionDigits: value < 10000000 ? 1 : 0 }).format(value / 1000000)
  return lang === 'en' ? `${millions}M ₸` : `${millions} млн ₸`
}

export const formatKztRange = (min, max, lang) => {
  if (!min && !max) return ''
  if (!max || min === max) return `≈ ${formatKzt(min, lang)}`
  const [minText, maxText] = [formatKzt(min, lang), formatKzt(max, lang)]
  // «1,1–2,7 млн ₸» вместо «1,1 млн ₸ – 2,7 млн ₸», если единица одна и та же.
  const unit = maxText.replace(/^[\d\s.,  ]+/, '')
  if (min >= 1000000 && minText.endsWith(unit)) return `≈ ${minText.slice(0, -unit.length).trim()}–${maxText}`
  return `≈ ${minText} – ${maxText}`
}

export const formatLocalRange = (min, max, currency, lang) => {
  if (!currency || min === null || min === undefined) return ''
  const number = (value) => formatNumber(value, lang)
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  const amount = !max || min === max ? number(min) : `${number(min)}–${number(max)}`
  return ['$', '€', '£', '¥', '₩', '₺', '₽', 'S$', 'A$', 'C$', 'NZ$', 'HK$'].includes(symbol) ? `${symbol}${amount}` : `${amount} ${symbol}`
}

export const requirementEntries = (university) => Object.entries(university.admission_requirements || {}).filter(([, value]) => value)

const normalizeSearch = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ё/g, 'е')

export const searchText = (university, countryNames) => normalizeSearch([
  university.name, university.name_local, university.slug,
  ...Object.values(university.name_translations || {}),
  university.city, ...Object.values(university.city_translations || {}),
  ...countryNames.map(names => names[university.country]),
].join(' '))

export const defaultFilters = {
  q: '', group: '', country: '', region: '', specialties: [], budget: 0, language: '', scholarship: false, favorites: false, ielts: 0, sort: 'ranking',
}

// «6.5+» или «6.0–6.5» → 6.5 / 6.0: минимальный балл IELTS из требований вуза.
export const ieltsRequirement = (university) => {
  const value = university.admission_requirements?.IELTS
  const match = value && String(value).match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

// Обычный клик открываем внутри приложения, Ctrl/Cmd-клик — в новой вкладке.
export const isPlainClick = (event) => !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)

export const applyFilters = (list, filters, { favorites, searchIndex }) => {
  const query = normalizeSearch(filters.q).trim()
  const words = query ? query.split(/\s+/) : []
  return list.filter(university => {
    if (filters.group && groupOf(university) !== filters.group) return false
    if (filters.country && university.country !== filters.country) return false
    if (filters.region && university.region !== filters.region) return false
    if (filters.specialties.length && !specialtyKeys(university).some(key => filters.specialties.includes(key))) return false
    if (filters.budget && !(university.tuition_min_kzt !== null && university.tuition_min_kzt <= filters.budget)) return false
    if (filters.language && !(university.languages || []).includes(filters.language)) return false
    if (filters.scholarship && !(university.scholarships || []).length) return false
    if (filters.favorites && !favorites.includes(university.slug)) return false
    if (filters.ielts) {
      const required = ieltsRequirement(university)
      if (required === null || required > filters.ielts) return false
    }
    if (words.length) {
      const text = searchIndex.get(university.slug) || ''
      if (!words.every(word => text.includes(word))) return false
    }
    return true
  })
}

const byRanking = (a, b) => (a.ranking_world ?? Infinity) - (b.ranking_world ?? Infinity)
  || (a.ranking ?? Infinity) - (b.ranking ?? Infinity)

export const sortUniversities = (list, sort, lang) => [...list].sort((a, b) => {
  if (sort === 'tuition') return (a.tuition_min_kzt ?? Infinity) - (b.tuition_min_kzt ?? Infinity) || byRanking(a, b)
  if (sort === 'name') return universityName(a, lang).localeCompare(universityName(b, lang), localeTag[lang])
  return byRanking(a, b) || universityName(a, lang).localeCompare(universityName(b, lang), localeTag[lang])
})

// Фильтры живут в адресной строке (?g=europe&c=DE&s=cs), чтобы подборкой
// можно было поделиться, а кнопка «назад» возвращала к тем же результатам.
export const filtersFromUrl = (search) => {
  const params = new URLSearchParams(search)
  return {
    ...defaultFilters,
    q: params.get('q') || '',
    group: params.get('g') || '',
    country: params.get('c') || '',
    region: params.get('r') || '',
    specialties: (params.get('s') || '').split(',').filter(Boolean),
    budget: Number(params.get('b')) || 0,
    language: params.get('l') || '',
    scholarship: params.get('sch') === '1',
    favorites: params.get('fav') === '1',
    ielts: Number(params.get('i')) || 0,
    sort: ['ranking', 'tuition', 'name'].includes(params.get('sort')) ? params.get('sort') : 'ranking',
  }
}

export const filtersToSearch = (filters) => {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.group) params.set('g', filters.group)
  if (filters.country) params.set('c', filters.country)
  if (filters.region) params.set('r', filters.region)
  if (filters.specialties.length) params.set('s', filters.specialties.join(','))
  if (filters.budget) params.set('b', String(filters.budget))
  if (filters.language) params.set('l', filters.language)
  if (filters.scholarship) params.set('sch', '1')
  if (filters.favorites) params.set('fav', '1')
  if (filters.ielts) params.set('i', String(filters.ielts))
  if (filters.sort !== 'ranking') params.set('sort', filters.sort)
  const text = params.toString()
  return text ? `?${text}` : ''
}

// localStorage может быть недоступен (приватный режим, запрет cookies).
export const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key)
      return value === null ? fallback : JSON.parse(value)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Без сохранения настройка просто не переживёт перезагрузку.
    }
  },
}
