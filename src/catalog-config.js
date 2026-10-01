// Общие справочники каталога. Модуль без зависимостей: его импортируют и
// фронтенд, и сид (scripts/seed.mjs), чтобы коды стран и валют совпадали.

// Группы направлений на главной. Порядок здесь = порядок вкладок.
export const GROUPS = ['kz', 'cn', 'us', 'europe', 'world']

// group — вкладка, languages — языки обучения по умолчанию,
// scholarships — программы, доступные гражданам РК для всех вузов страны.
export const COUNTRIES = {
  KZ: { group: 'kz', flag: '🇰🇿', currency: 'KZT', languages: ['kk', 'ru'], scholarships: ['state_grant'] },
  CN: { group: 'cn', flag: '🇨🇳', currency: 'CNY', languages: ['zh', 'en'], scholarships: [] },
  HK: { group: 'cn', flag: '🇭🇰', currency: 'HKD', languages: ['en'], scholarships: [] },
  US: { group: 'us', flag: '🇺🇸', currency: 'USD', languages: ['en'], scholarships: [] },
  GB: { group: 'europe', flag: '🇬🇧', currency: 'GBP', languages: ['en'], scholarships: ['chevening'] },
  DE: { group: 'europe', flag: '🇩🇪', currency: 'EUR', languages: ['de', 'en'], scholarships: ['daad'] },
  FR: { group: 'europe', flag: '🇫🇷', currency: 'EUR', languages: ['fr', 'en'], scholarships: [] },
  CH: { group: 'europe', flag: '🇨🇭', currency: 'CHF', languages: ['de', 'en'], scholarships: [] },
  NL: { group: 'europe', flag: '🇳🇱', currency: 'EUR', languages: ['en'], scholarships: [] },
  IT: { group: 'europe', flag: '🇮🇹', currency: 'EUR', languages: ['it', 'en'], scholarships: [] },
  ES: { group: 'europe', flag: '🇪🇸', currency: 'EUR', languages: ['es', 'en'], scholarships: [] },
  SE: { group: 'europe', flag: '🇸🇪', currency: 'SEK', languages: ['en'], scholarships: [] },
  DK: { group: 'europe', flag: '🇩🇰', currency: 'EUR', languages: ['en'], scholarships: [] },
  FI: { group: 'europe', flag: '🇫🇮', currency: 'EUR', languages: ['en'], scholarships: [] },
  BE: { group: 'europe', flag: '🇧🇪', currency: 'EUR', languages: ['en'], scholarships: [] },
  AT: { group: 'europe', flag: '🇦🇹', currency: 'EUR', languages: ['de', 'en'], scholarships: [] },
  IE: { group: 'europe', flag: '🇮🇪', currency: 'EUR', languages: ['en'], scholarships: [] },
  CZ: { group: 'europe', flag: '🇨🇿', currency: 'EUR', languages: ['cs', 'en'], scholarships: [] },
  PL: { group: 'europe', flag: '🇵🇱', currency: 'EUR', languages: ['pl', 'en'], scholarships: [] },
  HU: { group: 'europe', flag: '🇭🇺', currency: 'EUR', languages: ['en', 'hu'], scholarships: ['hungaricum'] },
  EE: { group: 'europe', flag: '🇪🇪', currency: 'EUR', languages: ['en', 'et'], scholarships: [] },
  CA: { group: 'world', flag: '🇨🇦', currency: 'CAD', languages: ['en'], scholarships: [] },
  AU: { group: 'world', flag: '🇦🇺', currency: 'AUD', languages: ['en'], scholarships: [] },
  NZ: { group: 'world', flag: '🇳🇿', currency: 'NZD', languages: ['en'], scholarships: [] },
  JP: { group: 'world', flag: '🇯🇵', currency: 'JPY', languages: ['ja', 'en'], scholarships: ['mext'] },
  KR: { group: 'world', flag: '🇰🇷', currency: 'KRW', languages: ['ko', 'en'], scholarships: ['gks'] },
  SG: { group: 'world', flag: '🇸🇬', currency: 'SGD', languages: ['en'], scholarships: [] },
  MY: { group: 'world', flag: '🇲🇾', currency: 'MYR', languages: ['en'], scholarships: [] },
  TR: { group: 'world', flag: '🇹🇷', currency: 'USD', languages: ['tr', 'en'], scholarships: ['turkiye'] },
  AE: { group: 'world', flag: '🇦🇪', currency: 'AED', languages: ['en'], scholarships: [] },
  RU: { group: 'world', flag: '🇷🇺', currency: 'RUB', languages: ['ru'], scholarships: ['russia_quota'] },
}

// Сколько тенге стоит единица валюты. Курсы ориентировочные: стоимость в
// каталоге показывается со знаком «≈». Чтобы обновить цены, поменяйте курс и
// перезапустите `npm run db:seed`.
export const RATES_KZT = {
  KZT: 1, USD: 520, EUR: 605, GBP: 700, CHF: 650, CNY: 73, HKD: 67, JPY: 3.5, KRW: 0.37,
  SGD: 405, AUD: 340, CAD: 375, NZD: 305, MYR: 123, TRY: 12.5, AED: 142, RUB: 6.5, SEK: 55,
}
export const RATES_UPDATED = '2026-10'

export const toKzt = (amount, currency) => {
  if (amount === null || amount === undefined || !RATES_KZT[currency]) return null
  return Math.round((amount * RATES_KZT[currency]) / 10000) * 10000
}

export const CURRENCY_SYMBOLS = { KZT: '₸', USD: '$', EUR: '€', GBP: '£', CNY: '¥', JPY: '¥', KRW: '₩', CHF: 'CHF', HKD: 'HK$', SGD: 'S$', AUD: 'A$', CAD: 'C$', NZD: 'NZ$', MYR: 'RM', TRY: '₺', AED: 'AED', RUB: '₽', SEK: 'SEK' }

// Ключи направлений. Подписи на трёх языках — в translations.js (specialtyNames).
export const SPECIALTIES = [
  'cs', 'engineering', 'medicine', 'business', 'economics', 'law', 'social', 'languages',
  'humanities', 'science', 'education', 'architecture', 'arts', 'agriculture',
]

export const SCHOLARSHIPS = [
  'state_grant', 'csc', 'need_blind', 'university_aid', 'chevening', 'daad', 'gks', 'mext',
  'turkiye', 'hungaricum', 'russia_quota',
]

export const TEACHING_LANGUAGES = ['en', 'ru', 'kk', 'zh', 'de', 'fr', 'ko', 'ja', 'tr', 'it', 'es', 'cs', 'pl', 'hu', 'et']

// Варианты бюджета в анкете и фильтре: максимальная стоимость года в тенге.
export const BUDGETS = [1500000, 5000000, 15000000]
