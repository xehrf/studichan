import { useState, useEffect } from 'react'
import {
  Search, MapPin, LogOut, Upload, Download, X, ArrowRight, Check, SlidersHorizontal, ChevronDown,
  Camera, ShieldCheck, ExternalLink, FileText, ChevronRight, GitCompare, Star, Building2, Users,
  Languages, Thermometer, Train, Car, Wallet, CalendarDays, Award, Landmark, ShoppingBag, Utensils,
  TreePine, Bus, BedDouble, Waves, Pill, Hospital, Stethoscope, Soup, Dumbbell, Trophy, BookOpen,
  WashingMachine, Banknote, Ruler, GraduationCap, Clock, Minus, BadgeCheck,
} from 'lucide-react'
import { useTranslation } from './translations'
import './App.css'

// The browser importer is deliberately local-only: a public import endpoint
// would let any visitor alter the production catalogue.
const canUseBrowserImporter = import.meta.env.DEV
const localized = (translations, lang, fallback = '') => translations?.[lang] || translations?.en || fallback
const parseSpecialties = (specialties) => Array.isArray(specialties)
  ? specialties.map(spec => String(spec).trim()).filter(Boolean)
  : String(specialties || '').split(',').map(spec => spec.trim()).filter(Boolean)
const imageList = (university) => {
  const gallery = Array.isArray(university.image_gallery) ? university.image_gallery : []
  const galleryUrls = gallery.map(item => typeof item === 'string' ? item : item?.url).filter(Boolean)
  return [...new Set([university.image_url, ...galleryUrls].filter(Boolean))]
}

// Сид пишет требования одной строкой «HSK: HSK 4; IELTS: IELTS 6.0; ...»,
// поэтому храним и полную запись для чипов, и короткую для таблицы с подписями.
const missingValue = /^(?:н\/д|нет данных|n\/a|na|-|—)$/i
const parseRequirements = (requirements) => {
  const parsed = {}
  for (const part of String(requirements || '').split(';')) {
    const separator = part.indexOf(':')
    if (separator === -1) continue
    const label = part.slice(0, separator).trim()
    const key = label.toLowerCase()
    const full = part.slice(separator + 1).trim()
    const value = full.toLowerCase().startsWith(key) ? full.slice(label.length).trim() : full
    if (key && value && !missingValue.test(value)) parsed[key] = { full: full || value, value }
  }
  return parsed
}

const amountMatch = (tuition) => String(tuition || '').match(/\d[\d\s ]*\d|\d/)
const tuitionAmount = (tuition) => {
  const amount = amountMatch(tuition)?.[0]?.trim()
  if (!amount) return ''
  const currency = String(tuition).match(/[₸$€¥£]|CNY|USD|KZT|RMB/i)?.[0]
  return currency ? `${amount} ${currency}` : amount
}
const tuitionValue = (tuition) => Number(amountMatch(tuition)?.[0].replace(/\D/g, '')) || Number.MAX_SAFE_INTEGER

const localeTag = { en: 'en-GB', ru: 'ru-RU', kk: 'kk-KZ' }
const formatDate = (value, lang) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(localeTag[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// PostgreSQL отдаёт NUMERIC строкой, поэтому баллы и площади приводим к числу
// в одном месте, а не в каждой карточке.
const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
const asArray = (value) => (Array.isArray(value) ? value : [])
const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})

// Сроки приёма хранятся как «месяц-день» без года, чтобы карточка не устаревала
// через сезон. Для показа подставляем любой невисокосный год и форматируем его
// по языку интерфейса.
const formatMonthDay = (value, lang) => {
  const match = /^(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return ''
  const date = new Date(Date.UTC(2001, Number(match[1]) - 1, Number(match[2])))
  return date.toLocaleDateString(localeTag[lang] || 'en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
}

const formatDuration = (minutes, t) => {
  const total = Number(minutes)
  if (!Number.isFinite(total) || total <= 0) return ''
  return t('uni.duration', Math.floor(total / 60), total % 60)
}

const formatMoney = (value, lang) => new Intl.NumberFormat(localeTag[lang] || 'en-GB').format(value)
const formatRange = (range, currency, lang, t) => {
  const [min, max] = asArray(range)
  if (!Number.isFinite(Number(min)) || !Number.isFinite(Number(max))) return ''
  return t('uni.moneyRange', formatMoney(min, lang), formatMoney(max, lang), currency || 'CNY')
}

// Порядок вывода инфраструктуры: сначала то, о чём чаще всего спрашивают
// абитуриенты (бассейн, магазины, аптека, больница), затем остальное.
const facilityOrder = ['pool', 'shops', 'pharmacy', 'hospital', 'clinic', 'canteen', 'gym', 'stadium', 'library', 'laundry', 'bank']
const facilityIcons = {
  pool: Waves, shops: ShoppingBag, pharmacy: Pill, hospital: Hospital, clinic: Stethoscope,
  canteen: Soup, gym: Dumbbell, stadium: Trophy, library: BookOpen, laundry: WashingMachine, banknote: Banknote, bank: Banknote,
}
const placeIcons = { landmark: Landmark, mall: ShoppingBag, food: Utensils, park: TreePine, transport: Bus }

const sortUniversities = (list, sort) => [...list].sort((a, b) => {
  if (sort === 'tuition') return tuitionValue(a.tuition) - tuitionValue(b.tuition)
  if (sort === 'name') return String(a.name).localeCompare(String(b.name))
  return (a.ranking || Number.MAX_SAFE_INTEGER) - (b.ranking || Number.MAX_SAFE_INTEGER)
})

function App() {
  const [universities, setUniversities] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState([])
  const [uniqueSpecialties, setUniqueSpecialties] = useState([])
  const [specialtySearch, setSpecialtySearch] = useState('')
  const [showSpecialtyFilter, setShowSpecialtyFilter] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedUniversity, setSelectedUniversity] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showQuestionnaire, setShowQuestionnaire] = useState(true)
  const [sort, setSort] = useState('ranking')
  const [compareIds, setCompareIds] = useState([])
  const [showCompare, setShowCompare] = useState(false)
  const [showStateGrant, setShowStateGrant] = useState(false)
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en')
  const t = useTranslation(lang)
  const specialtyLabel = (specialty) => {
    const translated = t(`specialtyNames.${specialty}`)
    return translated === `specialtyNames.${specialty}` ? specialty : translated
  }

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  useEffect(() => {
    fetchUniversities()
    fetch('/api/auth/me').then(response => response.json()).then(data => setUser(data.user)).catch(() => {})
  }, [])

  const fetchUniversities = async () => {
    try {
      const res = await fetch('/api/universities')
      const data = await res.json()
      setUniversities(data)
      setFiltered(data)
      
      // Extract unique specialties
      const allSpecialties = new Set()
      data.forEach(uni => {
        parseSpecialties(uni.specialties).forEach(spec => {
          allSpecialties.add(spec)
        })
      })
      setUniqueSpecialties(Array.from(allSpecialties).sort())
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearch(value)
    applyFilters(value, region, selectedSpecialties)
  }

  const handleRegionFilter = (r) => {
    setRegion(r)
    applyFilters(search, r, selectedSpecialties)
  }

  const handleSpecialtyFilter = (specialty) => {
    const updated = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter(s => s !== specialty)
      : [...selectedSpecialties, specialty]
    setSelectedSpecialties(updated)
    applyFilters(search, region, updated)
  }

  const applyFilters = (searchTerm, selectedRegion, specialties) => {
    let result = universities
    if (searchTerm) {
      result = result.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.city.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (selectedRegion) {
      result = result.filter(u => u.region === selectedRegion)
    }
    if (specialties.length > 0) {
      result = result.filter(u => {
        const uniSpecs = parseSpecialties(u.specialties)
        return specialties.some(spec => uniSpecs.includes(spec))
      })
    }
    setFiltered(result)
  }

  const handleViewDetails = (university) => {
    setShowCompare(false)
    setShowStateGrant(false)
    setSelectedUniversity(university)
  }

  // Сравнение ограничено четырьмя вузами: шире таблица уже не помещается на
  // экране ноутбука и её приходится листать по горизонтали.
  const toggleCompare = (id) => {
    setCompareIds(current => {
      if (current.includes(id)) return current.filter(value => value !== id)
      if (current.length >= 4) return current
      return [...current, id]
    })
  }

  const openCatalogue = () => {
    setSelectedUniversity(null)
    setShowCompare(false)
    setShowStateGrant(false)
  }

  const openStateGrant = () => {
    setSelectedUniversity(null)
    setShowCompare(false)
    setShowStateGrant(true)
  }

  const openCompare = () => {
    setSelectedUniversity(null)
    setShowStateGrant(false)
    setShowCompare(true)
  }

  const page = showStateGrant ? 'grant' : showCompare ? 'compare' : selectedUniversity ? 'university' : 'catalogue'

  const resetFilters = () => {
    setSearch('')
    setRegion('')
    setSelectedSpecialties([])
    setSpecialtySearch('')
    setShowSpecialtyFilter(false)
    setFiltered(universities)
  }

  const handleQuestionnaireComplete = ({ specialty, region: preferredRegion }) => {
    const nextSpecialties = specialty ? [specialty] : []
    setSelectedSpecialties(nextSpecialties)
    setRegion(preferredRegion)
    applyFilters(search, preferredRegion, nextSpecialties)
    setShowQuestionnaire(false)
  }

  return (
    <main className={`mobile-app ${showQuestionnaire ? 'questionnaire-mode' : ''}`}>
      {!showQuestionnaire && <header className="app-header">
        <button className="brand-lockup" onClick={openCatalogue}>
          <span className="brand-mark">C</span>
          <div className="header-title"><h1><strong>china</strong><span>course</span></h1><p>{t('title')}</p></div>
        </button>
        <div className="header-controls">
          <nav className="header-nav">
            <button className={page === 'catalogue' ? 'active' : ''} onClick={openCatalogue}>{t('catalogueCrumb')}</button>
            <button className={page === 'grant' ? 'active' : ''} onClick={openStateGrant}>{t('stateGrant.navLink')}</button>
          </nav>
          <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="kk">KK</option>
          </select>
          {!user && <button className="sign-in-btn" onClick={() => setShowAuth(true)}>{t('signIn')}</button>}
          {canUseBrowserImporter && <button className="icon-btn" title={t('importTitle')} onClick={() => setShowImport(true)}><Upload size={18} /></button>}
          {user && <button className="logout-btn" onClick={() => { fetch('/api/auth/logout', { method: 'POST' }); setUser(null) }}><LogOut size={18} /></button>}
        </div>
      </header>}
      {showQuestionnaire ? (
        <Questionnaire lang={lang} onLanguageChange={setLang} t={t} onComplete={handleQuestionnaireComplete} onSkip={() => setShowQuestionnaire(false)} />
      ) : page === 'grant' ? (
        <StateGrantPage lang={lang} t={t} onOpenUniversity={handleViewDetails} onBack={openCatalogue} />
      ) : page === 'compare' ? (
        <ComparePage ids={compareIds} lang={lang} t={t} specialtyLabel={specialtyLabel} onOpenUniversity={handleViewDetails} onRemove={toggleCompare} onBack={openCatalogue} />
      ) : page === 'university' ? (
        <UniversityDetail
          university={selectedUniversity} user={user} lang={lang} t={t} catalogueSize={universities.length}
          specialtyLabel={specialtyLabel} inCompare={compareIds.includes(selectedUniversity.id)}
          onToggleCompare={toggleCompare} onOpenStateGrant={openStateGrant}
          onBack={openCatalogue} onAuth={() => setShowAuth(true)}
        />
      ) : (
            <>
              <div className="catalogue-content">
              <section className="catalogue-intro">
                <div><p className="catalogue-eyebrow">{t('catalogueEyebrow')}</p><h2>{t('catalogueHeading')}</h2></div>
                <p>{t('catalogueDescription')}</p>
              </section>
              <div className="search-section">
            <div className="search-input">
              <Search size={18} />
              <input type="text" placeholder={t('searchPlaceholder')} value={search} onChange={handleSearch} />
            </div>
            <div className="region-filters">
              <button className={`filter-btn ${!region ? 'active' : ''}`} onClick={() => handleRegionFilter('')}>{t('filterAll')}</button>
              {['North', 'East', 'Central', 'South', 'West'].map(r => (
                <button key={r} className={`filter-btn ${region === r ? 'active' : ''}`} onClick={() => handleRegionFilter(r)}>{t(`regions.${r}`)}</button>
              ))}
            </div>
            {uniqueSpecialties.length > 0 && (
              <div className="specialty-filters">
                <div className="specialty-filter-bar">
                  <div className="specialty-filter-title"><p className="filter-label">{t('specialties')}</p>{selectedSpecialties.length > 0 && <span className="selected-filter-count">{selectedSpecialties.length}</span>}</div>
                  <button className={`specialty-toggle ${showSpecialtyFilter ? 'open' : ''}`} onClick={() => setShowSpecialtyFilter(value => !value)} aria-expanded={showSpecialtyFilter}>
                    <SlidersHorizontal size={16} /><span>{showSpecialtyFilter ? t('closeFilter') : t('chooseSpecialty')}</span><ChevronDown size={15} />
                  </button>
                </div>
                {selectedSpecialties.length > 0 && <div className="selected-specialties" aria-label={t('selectedSpecialties')}>
                  {selectedSpecialties.map(spec => <span className="selected-specialty" key={spec}>{specialtyLabel(spec)}<button onClick={() => handleSpecialtyFilter(spec)} aria-label={`${t('remove')} ${specialtyLabel(spec)}`}><X size={13} /></button></span>)}
                  <button className="clear-specialties" onClick={() => { setSelectedSpecialties([]); applyFilters(search, region, []) }}>{t('clear')}</button>
                </div>}
                {showSpecialtyFilter && <div className="specialty-panel">
                  <div className="specialty-search"><Search size={16} /><input type="search" value={specialtySearch} onChange={(e) => setSpecialtySearch(e.target.value)} placeholder={t('specialtySearch')} />{specialtySearch && <button className="clear-search" onClick={() => setSpecialtySearch('')} aria-label={t('clear')}><X size={15} /></button>}</div>
                  <div className="specialty-options">
                    {uniqueSpecialties.filter(spec => specialtyLabel(spec).toLowerCase().includes(specialtySearch.toLowerCase())).map(spec => <button key={spec} className={`specialty-option ${selectedSpecialties.includes(spec) ? 'active' : ''}`} onClick={() => handleSpecialtyFilter(spec)} aria-pressed={selectedSpecialties.includes(spec)}><span className="specialty-check">{selectedSpecialties.includes(spec) && <Check size={13} />}</span><span>{specialtyLabel(spec)}</span></button>)}
                    {uniqueSpecialties.filter(spec => specialtyLabel(spec).toLowerCase().includes(specialtySearch.toLowerCase())).length === 0 && <p className="no-specialties">{t('noSpecialties')}</p>}
                  </div>
                </div>}
              </div>
            )}
              </div>

              <div className="results-meta">
                <p>{t('matchFilters', filtered.length)}</p>
                <div className="results-tools">
                  <label className="sort-control">
                    <span className="filter-label">{t('sortLabel')}</span>
                    <select value={sort} onChange={(event) => setSort(event.target.value)}>
                      <option value="ranking">{t('sortOptions.ranking')}</option>
                      <option value="tuition">{t('sortOptions.tuition')}</option>
                      <option value="name">{t('sortOptions.name')}</option>
                    </select>
                  </label>
                  <button onClick={resetFilters}>{t('resetAll')}</button>
                </div>
              </div>

              {loading ? (
                <div className="loading">{t('loading')}</div>
              ) : (
                <div className="universities-list">
                  {filtered.length === 0 ? <div className="empty-state"><h3>{t('noResults')}</h3><p>{t('tryDifferentFilters')}</p><button onClick={resetFilters}>{t('resetAll')}</button></div> : sortUniversities(filtered, sort).map(uni => (
                    <UniversityCard
                      key={uni.id} university={uni} lang={lang} t={t} specialtyLabel={specialtyLabel}
                      onOpen={handleViewDetails} inCompare={compareIds.includes(uni.id)}
                      compareFull={compareIds.length >= 4} onToggleCompare={toggleCompare}
                    />
                  ))}
                </div>
              )}
              </div>
            </>
      )}

      {!showQuestionnaire && page !== 'compare' && compareIds.length > 0 && (
        <CompareBar
          universities={universities.filter(uni => compareIds.includes(uni.id))}
          lang={lang} t={t} onOpen={openCompare} onRemove={toggleCompare} onClear={() => setCompareIds([])}
        />
      )}

      {showAuth && <AuthModal t={t} onClose={() => setShowAuth(false)} onLogin={(userData) => { setUser(userData); setShowAuth(false) }} />}
      {canUseBrowserImporter && showImport && <ImportModal t={t} onClose={() => setShowImport(false)} onImported={fetchUniversities} />}
    </main>
  )
}

function UniversityCard({ university, lang, t, specialtyLabel, onOpen, inCompare, compareFull, onToggleCompare }) {
  const images = imageList(university)
  const name = localized(university.name_translations, lang, university.name)
  const requirements = parseRequirements(university.requirements)
  const specialties = parseSpecialties(localized(university.specialties_translations, lang, university.specialties))
  const summary = localized(university.description_translations, lang, university.description)
  const amount = tuitionAmount(university.tuition)
  const safety = university.city_safety && university.city_safety !== 'not_rated' ? university.city_safety : null

  return (
    <article className="uni-card" onClick={() => onOpen(university)}>
      <div className="uni-card-photo">
        {images[0] ? (
          <>
            <img src={images[0]} alt={name} loading="lazy" />
            <span className="photo-count"><Camera size={12} /> {t('photosCount', images.length)}</span>
          </>
        ) : (
          <div className="photo-empty"><Camera size={28} /><span>{t('photosPending')}</span></div>
        )}
      </div>
      <div className="uni-card-body">
        <div className="uni-card-main">
          <h3>{name}</h3>
          <p className="uni-location"><MapPin size={14} /> {university.city} · {t(`regions.${university.region}`)} · {t('publicUniversity')}</p>
          {summary && <p className="uni-summary">{summary}</p>}
          <div className="uni-chips">
            {requirements.hsk && <span className="uni-chip">{requirements.hsk.full}</span>}
            {requirements.ielts && <span className="uni-chip">{requirements.ielts.full}</span>}
            {university.has_csc_scholarship && <span className="uni-chip">{t('spec.csc')}</span>}
            {specialties.slice(0, 2).map(specialty => <span className="uni-chip" key={specialty}>{specialtyLabel(specialty)}</span>)}
            {safety && <span className={`uni-chip safety-chip safety-${safety}`}><ShieldCheck size={12} /> {t(`safetyLevels.${safety}`)}</span>}
          </div>
        </div>
        <div className="uni-card-aside">
          <div className="uni-badges">
            {university.ranking && <span className="ranking">{t('rankInChina', university.ranking)}</span>}
            {university.ranking_world && <span className="world-rank">{t('worldRank', university.ranking_world)}</span>}
            {university.agency_id && <span className="agency-badge">{t('agencySupport')}</span>}
          </div>
          {amount && (
            <div className="uni-price">
              <span className="uni-price-label">{t('tuitionFrom')}</span>
              <p>{amount}</p>
              <span className="uni-price-note">{t('perYear')}</span>
            </div>
          )}
          <div className="uni-card-actions">
            <button
              type="button"
              className={`compare-toggle ${inCompare ? 'active' : ''}`}
              aria-pressed={inCompare}
              disabled={!inCompare && compareFull}
              title={!inCompare && compareFull ? t('uni.compareFull') : undefined}
              onClick={(event) => { event.stopPropagation(); onToggleCompare(university.id) }}
            >
              <GitCompare size={15} /> {inCompare ? t('uni.compareRemove') : t('uni.compareAdd')}
            </button>
            <button className="apply-btn" onClick={(event) => { event.stopPropagation(); onOpen(university) }}>
              {t('viewUniversity')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function Questionnaire({ lang, onLanguageChange, t, onComplete, onSkip }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ goal: null, specialty: null, region: null, scholarship: null })

  const questions = [
    { key: 'goal', title: t('questionnaire.goalTitle'), options: ['bachelor', 'master', 'language'] },
    { key: 'specialty', title: t('questionnaire.specialtyTitle'), options: ['', 'Computer Science', 'Engineering', 'Medicine', 'Business', 'Economics', 'Law', 'Liberal Arts'] },
    { key: 'region', title: t('questionnaire.regionTitle'), options: ['', 'North', 'East', 'Central', 'South', 'West'] },
    { key: 'scholarship', title: t('questionnaire.scholarshipTitle'), options: ['yes', 'no'] },
  ]
  const question = questions[step]
  const isLast = step === questions.length - 1

  const choose = (value) => {
    setAnswers(current => ({ ...current, [question.key]: value }))
  }

  const continueQuestion = () => {
    if (answers[question.key] === null) return
    if (isLast) onComplete(answers)
    else setStep(step + 1)
  }

  return (
    <section className={`questionnaire ${question.options.length > 6 ? 'questionnaire-long' : ''}`} aria-label={t('questionnaire.title')}>
      <div className="questionnaire-hero">
        <div className="questionnaire-brand"><span className="brand-mark">C</span><span className="questionnaire-wordmark"><strong>china</strong><span>course</span></span></div>
        <div className="questionnaire-hero-copy">
          <p className="hero-support">{t('questionnaire.heroSupport')}</p>
          <h1>{t('questionnaire.heroTitleStart')}<br />{t('questionnaire.heroTitlePlace')}<br /><em>{t('questionnaire.heroTitleEnd')}</em></h1>
          <p className="hero-footer"><span>■</span> {t('questionnaire.builtAroundGoals')}</p>
        </div>
      </div>
      <div className="questionnaire-panel">
        <div className="questionnaire-topline"><span className="eyebrow">{t('questionnaire.matchProfile')}</span><div className="questionnaire-tools"><select className="lang-select questionnaire-lang-select" value={lang} onChange={(event) => onLanguageChange(event.target.value)} aria-label={t('language')}><option value="en">EN</option><option value="ru">RU</option><option value="kk">KK</option></select><button className="skip-btn" onClick={onSkip}>{t('questionnaire.skip')}</button></div></div>
        <div className="questionnaire-progress-meta"><span>{step + 1}<small> / 4</small></span></div>
        <div className="progress-track"><span style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
        <div className="question-block">
          <div className="questionnaire-heading"><div><p className="questionnaire-step">{t('questionnaire.step', step + 1, questions.length)}</p><h2>{question.title}</h2></div></div>
          <div className="answer-grid">
            {question.options.map((option, index) => (
              <button type="button" key={option || 'all'} className={`answer-btn ${answers[question.key] === option ? 'selected' : ''}`} onClick={() => choose(option)} aria-pressed={answers[question.key] === option}>
                <span className="answer-index">{index + 1}</span><span className="answer-label">{question.key === 'goal' ? t(`questionnaire.goals.${option}`) : question.key === 'region' ? (option ? t(`regions.${option}`) : t('filterAll')) : question.key === 'scholarship' ? t(`questionnaire.scholarships.${option}`) : (option ? t(`specialtyNames.${option}`) : t('filterAll'))}</span><span className="answer-indicator">{answers[question.key] === option && <Check size={16} />}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="questionnaire-actions"><p>{t('questionnaire.answerHint')}</p><button type="button" className="continue-btn" onClick={continueQuestion} disabled={answers[question.key] === null}>{isLast ? t('questionnaire.seeMatches') : t('questionnaire.continue')} <ArrowRight size={17} /></button></div>
      </div>
    </section>
  )
}

function ImportModal({ t, onClose, onImported }) {
  const [csv, setCsv] = useState('')
  const [status, setStatus] = useState('')
  const [importing, setImporting] = useState(false)

  const template = `name,city,region,ranking,specialties,requirements,tuition,description,website,source_url,verified_at\nTsinghua University,Beijing,North,1,"Engineering, Computer Science",HSK 4+,30000 CNY/year,Top research university,https://www.tsinghua.edu.cn,https://www.tsinghua.edu.cn,2026-08-31`

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'universities-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importCsv = async (event) => {
    event.preventDefault()
    setImporting(true); setStatus('')
    try {
      const response = await fetch('/api/admin/import-universities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Не удалось импортировать файл')
      setStatus(`${t('importSuccess', data.imported)} ${data.skipped.length ? t('skippedRows', data.skipped.join(', ')) : ''}`)
      onImported()
    } catch (error) { setStatus(error.message) }
    finally { setImporting(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title"><h3>{t('importTitle')}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>
        <p className="import-hint">{t('importHint')}</p>
        <button className="template-btn" onClick={downloadTemplate}><Download size={16} /> {t('downloadTemplate')}</button>
        <form onSubmit={importCsv}>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} required placeholder="name,city,region,..." rows="10" />
          <button type="submit" disabled={importing}>{importing ? t('importing') : t('importAction')}</button>
        </form>
        {status && <p className="import-status">{status}</p>}
        <p className="columns-help">{t('requiredColumns')} <code>name, city, region</code>. {t('optionalColumns')} city_safety (low, medium, high), ranking, specialties, requirements, tuition, description, website, source_url, verified_at.</p>
      </div>
    </div>
  )
}

// Пометка стоит у значений, которые каталог вывел из уровня города и вуза, а не
// взял с официальной страницы: их нужно сверять перед подачей документов.
function Preliminary({ t }) {
  return <span className="preliminary-tag" title={t('uni.preliminaryNote')}>{t('uni.preliminary')}</span>
}

function FactTile({ icon: Icon, label, value, note, preliminary, t }) {
  return (
    <div className="fact-tile">
      <span className="fact-label">{Icon && <Icon size={14} />} {label}</span>
      <strong className={value ? '' : 'muted'}>{value || t('uni.pending')}</strong>
      {note && <span className="fact-note">{note}</span>}
      {preliminary && value && <Preliminary t={t} />}
    </div>
  )
}

function CompareBar({ universities, lang, t, onOpen, onRemove, onClear }) {
  return (
    <div className="compare-bar" role="region" aria-label={t('uni.compareTitle')}>
      <div className="compare-bar-inner">
        <span className="compare-bar-count"><GitCompare size={15} /> {t('uni.compareCount', universities.length)}</span>
        <div className="compare-bar-list">
          {universities.map(uni => {
            const name = localized(uni.name_translations, lang, uni.name)
            return (
              <span className="compare-bar-item" key={uni.id}>
                {name}
                <button type="button" onClick={() => onRemove(uni.id)} aria-label={`${t('remove')}: ${name}`}><X size={13} /></button>
              </span>
            )
          })}
        </div>
        <div className="compare-bar-actions">
          <button type="button" className="compare-clear" onClick={onClear}>{t('uni.compareClear')}</button>
          <button type="button" className="apply-btn" onClick={onOpen} disabled={universities.length < 2}>
            {t('uni.compareOpen')} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function ComparePage({ ids, lang, t, onOpenUniversity, onRemove, onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const key = ids.join(',')

  useEffect(() => {
    if (!key) {
      setItems([])
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/universities/compare?ids=${key}`)
      .then(response => response.json())
      .then(data => { if (!cancelled) setItems(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [key])

  const yesNo = (value) => <span className={value ? 'positive' : 'muted'}>{value ? t('uni.yes') : t('uni.no')}</span>
  const range = (cost, field) => formatRange(asObject(cost)[field], asObject(cost).currency, lang, t)
  const intake = (deadlines, season) => {
    const window = asObject(asObject(deadlines)[season])
    if (!window.from || !window.to) return null
    return t('uni.intakeWindow', formatMonthDay(window.from, lang), formatMonthDay(window.to, lang))
  }

  const rows = [
    { label: t('uni.score'), render: uni => (toNumber(uni.site_rating) ? t('uni.scoreOutOf', toNumber(uni.site_rating)) : null) },
    { label: t('spec.rankChina'), render: uni => (uni.ranking ? `#${uni.ranking}` : null) },
    { label: t('spec.rankWorld'), render: uni => (uni.ranking_world ? t('rankWorldValue', uni.ranking_world) : null) },
    { label: t('spec.city'), render: uni => uni.city },
    { label: t('uni.founded'), render: uni => uni.founded_year || null },
    { label: t('uni.campusArea'), render: uni => (toNumber(uni.campus_area_ha) ? t('uni.hectares', toNumber(uni.campus_area_ha)) : null) },
    { label: t('spec.students'), render: uni => uni.students_count || null },
    { label: t('uni.internationalStudents'), render: uni => uni.international_students || null },
    { label: t('uni.languagesTitle'), render: uni => asArray(uni.languages).map(code => t(`uni.languageNames.${code}`)).join(', ') },
    { label: t('spec.hsk'), render: uni => parseRequirements(uni.requirements).hsk?.value },
    { label: t('spec.ielts'), render: uni => parseRequirements(uni.requirements).ielts?.value },
    { label: t('spec.tuition'), render: uni => uni.tuition },
    { label: t('uni.campusLiving'), render: uni => range(uni.living_cost, 'campus') },
    { label: t('uni.cityLiving'), render: uni => range(uni.living_cost, 'city') },
    {
      label: t('uni.roomPlaces'),
      render: uni => {
        const places = asArray(asObject(uni.dorm).roomPlaces)
        return places.length === 2 ? t('uni.roomPlacesValue', places[0], places[1]) : null
      },
    },
    {
      label: t('uni.bathroom'),
      render: uni => {
        const bathroom = asObject(uni.dorm).bathroom
        return bathroom ? t(`uni.bathrooms.${bathroom}`) : null
      },
    },
    { label: t('uni.facilities.pool'), render: uni => yesNo(asArray(uni.campus_facilities).includes('pool')) },
    { label: t('uni.facilities.hospital'), render: uni => yesNo(asArray(uni.campus_facilities).includes('hospital')) },
    { label: t('uni.winterAvg'), render: uni => (Number.isFinite(asObject(uni.climate).winter) ? t('uni.degrees', asObject(uni.climate).winter) : null) },
    { label: t('uni.summerAvg'), render: uni => (Number.isFinite(asObject(uni.climate).summer) ? t('uni.degrees', asObject(uni.climate).summer) : null) },
    { label: t('uni.humidity'), render: uni => (Number.isFinite(asObject(uni.climate).humidity) ? t('uni.percent', asObject(uni.climate).humidity) : null) },
    { label: t('uni.autumnIntake'), render: uni => intake(uni.deadlines, 'autumn') },
    { label: t('uni.springIntake'), render: uni => intake(uni.deadlines, 'spring') },
    {
      label: t('uni.reviewTime'),
      render: uni => {
        const weeks = asArray(asObject(uni.deadlines).reviewWeeks)
        return weeks.length === 2 ? t('uni.reviewWeeks', weeks[0], weeks[1]) : null
      },
    },
    {
      label: t('uni.universityGrants'),
      render: uni => {
        const grants = asArray(uni.university_grants)
        if (!grants.length) return null
        const best = Math.max(...grants.map(item => Number(item.discount) || 0))
        return t('uni.discountValue', best)
      },
    },
    {
      label: t('uni.provinceGrantTitle'),
      render: uni => {
        const provinceGrant = asObject(uni.province_grant)
        return provinceGrant.available ? localized(provinceGrant.name, lang, '') || t('uni.yes') : yesNo(false)
      },
    },
    { label: t('uni.stateGrantTitle'), render: uni => yesNo(uni.has_csc_scholarship) },
    { label: t('spec.safety'), render: uni => (uni.city_safety && uni.city_safety !== 'not_rated' ? t(`safetyLevels.${uni.city_safety}`) : null) },
  ]

  return (
    <div className="detail-view compare-view">
      <nav className="detail-crumbs">
        <button className="back-btn" onClick={onBack}>{t('catalogueCrumb')}</button>
        <ChevronRight size={13} />
        <span className="current">{t('uni.compareTitle')}</span>
      </nav>

      <header className="compare-head">
        <h2>{t('uni.compareTitle')}</h2>
        <p>{t('uni.preliminaryNote')}</p>
      </header>

      {loading ? <div className="loading">{t('loading')}</div> : items.length < 2 ? (
        <div className="empty-state"><h3>{t('uni.compareTitle')}</h3><p>{t('uni.compareEmpty')}</p><button onClick={onBack}>{t('uni.compareBack')}</button></div>
      ) : (
        <div className="compare-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col" className="compare-corner">{t('characteristics')}</th>
                {items.map(uni => {
                  const name = localized(uni.name_translations, lang, uni.name)
                  return (
                    <th scope="col" key={uni.id}>
                      <div className="compare-col-head">
                        {uni.image_url && <img src={uni.image_url} alt="" loading="lazy" />}
                        <button type="button" className="compare-col-name" onClick={() => onOpenUniversity(uni)}>{name}</button>
                        <button type="button" className="compare-col-remove" onClick={() => onRemove(uni.id)}>
                          <X size={13} /> {t('remove')}
                        </button>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {items.map(uni => {
                    const value = row.render(uni)
                    return <td key={uni.id}>{value || <span className="muted">{t('uni.pending')}</span>}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StateGrantPage({ lang, t, onOpenUniversity, onBack }) {
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/state-grant/universities')
      .then(response => response.json())
      .then(data => { if (!cancelled) setUniversities(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setUniversities([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="detail-view grant-view">
      <nav className="detail-crumbs">
        <button className="back-btn" onClick={onBack}>{t('catalogueCrumb')}</button>
        <ChevronRight size={13} />
        <span className="current">{t('stateGrant.navLink')}</span>
      </nav>

      <header className="grant-hero">
        <p className="catalogue-eyebrow">{t('stateGrant.eyebrow')}</p>
        <h2>{t('stateGrant.title')}</h2>
        <p className="grant-intro">{t('stateGrant.intro')}</p>
      </header>

      <div className="grant-layout">
        <div className="grant-main">
          <section className="detail-section">
            <h3>{t('stateGrant.coversTitle')}</h3>
            <div className="document-grid">
              {t('stateGrant.covers').map(item => <span className="document-item" key={item}><Check size={16} /> {item}</span>)}
            </div>
          </section>

          <section className="detail-section">
            <h3>{t('stateGrant.routesTitle')}</h3>
            <div className="grant-routes">
              {t('stateGrant.routes').map(route => (
                <article className="grant-route" key={route.name}>
                  <h4>{route.name}</h4>
                  <p>{route.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h3>{t('stateGrant.requirementsTitle')}</h3>
            <ul className="grant-list">
              {t('stateGrant.requirements').map(item => <li key={item}><BadgeCheck size={15} /> {item}</li>)}
            </ul>
          </section>

          <section className="detail-section">
            <h3>{t('stateGrant.timelineTitle')}</h3>
            <ol className="grant-timeline">
              {t('stateGrant.timeline').map(step => (
                <li key={step.when}><span className="grant-timeline-when">{step.when}</span><span>{step.what}</span></li>
              ))}
            </ol>
          </section>

          <section className="detail-section">
            <h3>{t('stateGrant.documentsTitle')}</h3>
            <div className="document-grid">
              {t('stateGrant.documents').map(item => <span className="document-item" key={item}><FileText size={16} /> {item}</span>)}
            </div>
          </section>

          <section className="detail-section">
            <div className="detail-map-heading">
              <h3>{t('stateGrant.universitiesTitle')}</h3>
              <span className="filter-label">{t('stateGrant.universitiesCount', universities.length)}</span>
            </div>
            {loading ? <div className="loading">{t('loading')}</div> : universities.length === 0 ? (
              <p className="document-note">{t('stateGrant.universitiesEmpty')}</p>
            ) : (
              <div className="grant-universities">
                {universities.map(uni => (
                  <button type="button" className="grant-university" key={uni.id} onClick={() => onOpenUniversity(uni)}>
                    <span className="grant-university-name">{localized(uni.name_translations, lang, uni.name)}</span>
                    <span className="grant-university-meta">
                      <MapPin size={13} /> {uni.city}
                      {uni.ranking && <> · {t('rankInChina', uni.ranking)}</>}
                      {toNumber(uni.site_rating) && <> · {t('uni.scoreOutOf', toNumber(uni.site_rating))}</>}
                    </span>
                    <ChevronRight size={15} />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="detail-aside">
          <div className="detail-panel">
            <div className="panel-facts">
              {t('stateGrant.covers').slice(0, 3).map(item => (
                <span key={item}><span>{item}</span><strong className="positive"><Check size={15} /></strong></span>
              ))}
            </div>
            <a className="panel-link" href="https://www.campuschina.org" target="_blank" rel="noreferrer">
              {t('stateGrant.portalLink')} <ExternalLink size={15} />
            </a>
          </div>
          <div className="detail-verified">
            <ShieldCheck size={17} />
            <p>{t('stateGrant.disclaimer')}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function UniversityDetail({ university: summary, user, lang, t, catalogueSize, specialtyLabel, inCompare, onToggleCompare, onOpenStateGrant, onBack, onAuth }) {
  // Список каталога намеренно лёгкий и не везёт подробные JSONB-поля, поэтому
  // страница всегда догружает полную запись и до её прихода показывает то, что
  // уже известно из карточки.
  const [details, setDetails] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const university = details && details.id === summary.id ? details : summary
  const agency = details?.agency || null
  const images = imageList(university)
  const mapQuery = `${university.name}, ${university.city}, China`
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`

  useEffect(() => {
    setSelectedImage(0)
    let cancelled = false
    fetch(`/api/universities/${summary.id}`)
      .then(response => response.json())
      .then(data => { if (!cancelled && data?.id) setDetails(data) })
      .catch(error => console.error(error))
    return () => { cancelled = true }
  }, [summary.id])

  const handleSubmitApplication = async () => {
    if (!user) {
      onAuth()
      return
    }
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, universityId: university.id }),
      })
      alert(t('applicationSubmitted'))
    } catch {
      alert(t('applicationError'))
    }
  }

  const name = localized(university.name_translations, lang, university.name)
  const requirements = parseRequirements(university.requirements)
  const specialties = parseSpecialties(localized(university.specialties_translations, lang, university.specialties))
  const description = localized(university.description_translations, lang, university.description)
  const amount = tuitionAmount(university.tuition)
  const safety = university.city_safety && university.city_safety !== 'not_rated' ? university.city_safety : null
  const verified = formatDate(university.verified_at || university.data_checked_at, lang)
  const sourceUrl = university.source_url || university.website
  const sourceHost = hostOf(sourceUrl)
  const visibleThumbs = images.slice(0, 5)
  const hiddenThumbs = images.length - visibleThumbs.length

  const knownFor = localized(university.known_for_translations, lang, '')
  const campuses = asArray(university.campuses)
  const dorm = asObject(university.dorm)
  const dormPlaces = asArray(dorm.roomPlaces)
  const facilities = asArray(university.campus_facilities)
  const climate = asObject(university.climate)
  const nearbyCities = asArray(university.nearby_cities)
  const nearbyPlaces = asArray(university.nearby_places)
  const livingCost = asObject(university.living_cost)
  const languages = asArray(university.languages)
  const extraDocuments = asArray(university.extra_documents)
  const deadlines = asObject(university.deadlines)
  const reviewWeeks = asArray(deadlines.reviewWeeks)
  const universityGrants = asArray(university.university_grants)
  const provinceGrant = asObject(university.province_grant)
  const reviews = asArray(university.reviews)
  const reviewsAverage = toNumber(university.reviews_average)
  const siteRating = toNumber(university.site_rating)
  const campusArea = toNumber(university.campus_area_ha)

  const intakeWindow = (season) => {
    const window = asObject(deadlines[season])
    if (!window.from || !window.to) return ''
    return t('uni.intakeWindow', formatMonthDay(window.from, lang), formatMonthDay(window.to, lang))
  }

  const specRows = [
    university.ranking && { label: t('spec.rankChina'), value: t('rankOfTotal', university.ranking, catalogueSize) },
    university.ranking_world && { label: t('spec.rankWorld'), value: t('rankWorldValue', university.ranking_world) },
    { label: t('spec.city'), value: university.city },
    { label: t('spec.region'), value: t(`regions.${university.region}`) },
    { label: t('spec.type'), value: t('publicUniversity') },
    { label: t('spec.hsk'), value: requirements.hsk?.value || t('noRequirement'), muted: !requirements.hsk },
    { label: t('spec.ielts'), value: requirements.ielts?.value || t('noRequirement'), muted: !requirements.ielts },
    { label: t('spec.toefl'), value: requirements.toefl?.value || t('noRequirement'), muted: !requirements.toefl },
    amount && { label: t('spec.tuition'), value: university.tuition, strong: true },
    { label: t('spec.csc'), value: university.has_csc_scholarship ? t('cscAvailable') : t('cscUnknown'), positive: university.has_csc_scholarship, muted: !university.has_csc_scholarship },
    safety && { label: t('spec.safety'), value: t(`safetyLevels.${safety}`), positive: safety === 'high' },
    specialties.length > 0 && { label: t('spec.specialties'), chips: specialties },
    { label: t('spec.students'), value: university.students_count || t('dataPending'), muted: !university.students_count },
    { label: t('spec.verified'), value: verified || t('dataPending'), muted: !verified },
  ].filter(Boolean)

  return (
    <div className="detail-view">
      <nav className="detail-crumbs">
        <button className="back-btn" onClick={onBack}>{t('catalogueCrumb')}</button>
        <ChevronRight size={13} />
        <span>{university.city}</span>
        <ChevronRight size={13} />
        <span className="current">{name}</span>
      </nav>

      <div className="detail-layout">
        <div className="detail-main">
          {images.length > 0 ? (
            <div className="detail-gallery">
              <div className="detail-stage">
                <img className="detail-image" src={images[selectedImage] || images[0]} alt={name} />
                <span className="gallery-position">{t('galleryPosition', Math.min(selectedImage + 1, images.length), images.length)}</span>
              </div>
              {images.length > 1 && <div className="detail-thumbnails" aria-label={t('photoGallery')}>
                {visibleThumbs.map((image, index) => (
                  <button type="button" key={image} className={`detail-thumbnail ${index === selectedImage ? 'active' : ''}`} onClick={() => setSelectedImage(index)} aria-label={`${t('photoGallery')} ${index + 1}`}>
                    <img src={image} alt="" />
                  </button>
                ))}
                {hiddenThumbs > 0 && <span className="detail-thumbnail more">{t('morePhotos', hiddenThumbs)}</span>}
              </div>}
            </div>
          ) : (
            <div className="detail-gallery detail-gallery-empty"><Camera size={34} /><span>{t('photosPending')}</span></div>
          )}

          <header className="detail-headline">
            <div className="uni-badges">
              {university.ranking && <span className="ranking">{t('rankInChina', university.ranking)}</span>}
              {university.ranking_world && <span className="world-rank">{t('worldRank', university.ranking_world)}</span>}
              {safety && <span className={`safety-badge safety-${safety}`}>{t('citySafety')}: {t(`safetyLevels.${safety}`)}</span>}
            </div>
            <h2>{name}</h2>
            <p className="detail-city">
              {/* У городов центрального подчинения провинция совпадает с городом,
                  поэтому второй раз её не повторяем. */}
              <MapPin size={14} /> {university.city}
              {university.province && university.province !== university.city && <> · {university.province}</>}
              {' '}· {t(`regions.${university.region}`)}
            </p>
            <div className="detail-headline-actions">
              {siteRating && (
                <span className="score-badge" title={t('uni.scoreExplainer')}>
                  <Star size={15} /> <strong>{t('uni.scoreOutOf', siteRating)}</strong> <span>{t('uni.score')}</span>
                </span>
              )}
              {reviewsAverage && <span className="score-reviews"><BadgeCheck size={14} /> {t('uni.reviewsAverage', reviewsAverage)}</span>}
              <button
                type="button"
                className={`compare-toggle ${inCompare ? 'active' : ''}`}
                aria-pressed={inCompare}
                onClick={() => onToggleCompare(university.id)}
              >
                <GitCompare size={15} /> {inCompare ? t('uni.compareRemove') : t('uni.compareAdd')}
              </button>
            </div>
          </header>

          <section className="detail-section">
            <h3>{t('uni.overview')}</h3>
            <div className="fact-grid">
              <FactTile t={t} icon={CalendarDays} label={t('uni.founded')} value={university.founded_year ? t('uni.foundedValue', university.founded_year) : ''} />
              <FactTile t={t} icon={Ruler} label={t('uni.campusArea')} value={campusArea ? t('uni.hectares', campusArea) : ''} />
              <FactTile t={t} icon={Building2} label={t('uni.campusCount')} value={campuses.length ? String(campuses.length) : ''} />
              <FactTile t={t} icon={Users} label={t('spec.students')} value={university.students_count ? formatMoney(university.students_count, lang) : ''} />
              <FactTile t={t} icon={GraduationCap} label={t('uni.internationalStudents')} value={university.international_students ? formatMoney(university.international_students, lang) : ''} />
              <FactTile
                t={t} icon={Languages} label={t('uni.languagesTitle')} preliminary
                value={languages.map(code => t(`uni.languageNames.${code}`)).join(', ')}
                note={languages.length > 1 ? t('uni.languagesNote') : ''}
              />
            </div>
            {knownFor && <p className="detail-desc"><strong>{t('uni.knownFor')}:</strong> {knownFor}</p>}
          </section>

          <section className="detail-section">
            <h3>{t('uni.campusTitle')}</h3>
            {campuses.length > 0 ? (
              <div className="campus-grid">
                {campuses.map(campus => (
                  <article className="campus-card" key={campus.name || campus.founded_year}>
                    <h4>{localized(campus.name, lang, campus.name) || t('uni.campusCount')}</h4>
                    <dl>
                      {campus.founded_year && <div><dt>{t('uni.founded')}</dt><dd>{campus.founded_year}</dd></div>}
                      {campus.renovated_year && <div><dt>{t('uni.renovated')}</dt><dd>{campus.renovated_year}</dd></div>}
                      {campus.area_ha && <div><dt>{t('uni.campusArea')}</dt><dd>{t('uni.hectares', campus.area_ha)}</dd></div>}
                      {campus.dorm_condition && <div><dt>{t('uni.dormCondition')}</dt><dd>{t(`uni.dormConditions.${campus.dorm_condition}`)}</dd></div>}
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <p className="document-note">{t('uni.campusEmpty')}</p>
            )}

            <div className="dorm-panel">
              <div className="dorm-panel-head"><BedDouble size={18} /><h4>{t('uni.dormTitle')}</h4><Preliminary t={t} /></div>
              <div className="fact-grid">
                <FactTile t={t} label={t('uni.roomPlaces')} value={dormPlaces.length === 2 ? t('uni.roomPlacesValue', dormPlaces[0], dormPlaces[1]) : ''} />
                <FactTile t={t} label={t('uni.bathroom')} value={dorm.bathroom ? t(`uni.bathrooms.${dorm.bathroom}`) : ''} />
                <FactTile t={t} label={t('uni.dormCondition')} value={dorm.condition ? t(`uni.dormConditions.${dorm.condition}`) : ''} />
                <FactTile t={t} label={t('uni.renovated')} value={dorm.renovated_year ? String(dorm.renovated_year) : ''} />
              </div>
            </div>

            <h4 className="subsection-title">{t('uni.facilitiesTitle')}</h4>
            <div className="facility-grid">
              {facilityOrder.map(key => {
                const Icon = facilityIcons[key]
                const present = facilities.includes(key)
                return (
                  <span className={`facility-item ${present ? 'present' : 'absent'}`} key={key}>
                    <Icon size={16} />
                    <span>{t(`uni.facilities.${key}`)}</span>
                    {present ? <Check size={14} /> : <Minus size={14} />}
                  </span>
                )
              })}
            </div>
          </section>

          {nearbyPlaces.length > 0 && <section className="detail-section">
            <h3>{t('uni.nearbyTitle')}</h3>
            <ul className="nearby-list">
              {nearbyPlaces.map(place => {
                const Icon = placeIcons[place.category] || Landmark
                return (
                  <li key={localized(place.name, lang, '')}>
                    <span className="nearby-icon"><Icon size={16} /></span>
                    <span className="nearby-name">
                      {localized(place.name, lang, '')}
                      <small>{t(`uni.nearbyCategories.${place.category}`)}</small>
                    </span>
                    <span className="nearby-distance">{t('uni.km', place.km)}</span>
                  </li>
                )
              })}
            </ul>
            <p className="document-note">{t('uni.nearbyNote')}</p>
          </section>}

          {nearbyCities.length > 0 && <section className="detail-section">
            <h3>{t('uni.nearbyCitiesTitle')}</h3>
            <div className="route-table">
              <div className="route-row route-head">
                <span>{t('spec.city')}</span>
                <span><Train size={14} /> {t('uni.byRail')}</span>
                <span><Car size={14} /> {t('uni.byRoad')}</span>
              </div>
              {nearbyCities.map(link => (
                <div className="route-row" key={link.city}>
                  <span className="route-city">{link.city}</span>
                  <span>{t('uni.distanceTime', link.railKm, formatDuration(link.railMinutes, t))}</span>
                  <span>{t('uni.distanceTime', link.roadKm, formatDuration(link.roadMinutes, t))}</span>
                </div>
              ))}
            </div>
          </section>}

          {Number.isFinite(climate.winter) && <section className="detail-section">
            <h3>{t('uni.climateTitle')}</h3>
            <div className="fact-grid climate-grid">
              <FactTile t={t} icon={Thermometer} label={t('uni.winterAvg')} value={t('uni.degrees', climate.winter)} />
              <FactTile t={t} icon={Thermometer} label={t('uni.summerAvg')} value={t('uni.degrees', climate.summer)} />
              <FactTile t={t} icon={Waves} label={t('uni.humidity')} value={t('uni.percent', climate.humidity)} />
            </div>
            {climate.zone && <p className="document-note">{t(`uni.climateZones.${climate.zone}`)}</p>}
          </section>}

          <section className="detail-section">
            <h3>{t('uni.costsTitle')}</h3>
            <dl className="spec-table">
              <div className="spec-row">
                <dt>{t('uni.tuitionPerYear')}</dt>
                <dd className={university.tuition ? 'strong' : 'muted'}>{university.tuition || t('uni.pending')}</dd>
              </div>
              <div className="spec-row">
                <dt>{t('uni.campusLiving')}<small>{t('uni.campusLivingNote')}</small></dt>
                <dd>
                  {formatRange(livingCost.campus, livingCost.currency, lang, t) || <span className="muted">{t('uni.pending')}</span>}
                  {livingCost.campus && <> <span className="spec-note">{t('uni.perMonth')}</span> <Preliminary t={t} /></>}
                </dd>
              </div>
              <div className="spec-row">
                <dt>{t('uni.cityLiving')}<small>{t('uni.cityLivingNote', livingCost.radiusKm || 3)}</small></dt>
                <dd>
                  {formatRange(livingCost.city, livingCost.currency, lang, t) || <span className="muted">{t('uni.pending')}</span>}
                  {livingCost.city && <> <span className="spec-note">{t('uni.perMonth')}</span> <Preliminary t={t} /></>}
                </dd>
              </div>
              {livingCost.utilities && <div className="spec-row">
                <dt>{t('uni.utilities')}</dt>
                <dd>{formatRange(livingCost.utilities, livingCost.currency, lang, t)} <span className="spec-note">{t('uni.perMonth')}</span></dd>
              </div>}
            </dl>
          </section>

          <section className="detail-section">
            <h3>{t('uni.admissionTitle')}</h3>
            <dl className="spec-table">
              <div className="spec-row"><dt>{t('spec.hsk')}</dt><dd className={requirements.hsk ? '' : 'muted'}>{requirements.hsk?.value || t('noRequirement')}</dd></div>
              <div className="spec-row"><dt>{t('spec.ielts')}</dt><dd className={requirements.ielts ? '' : 'muted'}>{requirements.ielts?.value || t('noRequirement')}</dd></div>
              <div className="spec-row"><dt>{t('spec.toefl')}</dt><dd className={requirements.toefl ? '' : 'muted'}>{requirements.toefl?.value || t('noRequirement')}</dd></div>
              <div className="spec-row"><dt>{t('uni.satLabel')}</dt><dd className="muted">{t('uni.satNote')}</dd></div>
            </dl>

            {extraDocuments.length > 0 && <>
              <h4 className="subsection-title">{t('uni.extraDocumentsTitle')}</h4>
              <div className="document-grid">
                {extraDocuments.map(key => <span className="document-item" key={key}><FileText size={16} /> {t(`uni.extraDocuments.${key}`)}</span>)}
              </div>
            </>}

            <h4 className="subsection-title">{t('uni.deadlinesTitle')}</h4>
            <div className="fact-grid">
              <FactTile t={t} icon={CalendarDays} label={t('uni.autumnIntake')} value={intakeWindow('autumn')} preliminary />
              <FactTile t={t} icon={CalendarDays} label={t('uni.springIntake')} value={intakeWindow('spring') || ''} note={intakeWindow('spring') ? '' : t('uni.noSpringIntake')} preliminary />
              <FactTile t={t} icon={Clock} label={t('uni.reviewTime')} value={reviewWeeks.length === 2 ? t('uni.reviewWeeks', reviewWeeks[0], reviewWeeks[1]) : ''} preliminary />
            </div>
          </section>

          <section className="detail-section">
            <h3>{t('uni.grantsTitle')}</h3>
            {universityGrants.length > 0 && <div className="grant-cards">
              {universityGrants.map(item => (
                <article className="grant-card" key={item.key}>
                  <span className="grant-card-icon"><Award size={17} /></span>
                  <div>
                    <h4>{t(`uni.grantNames.${item.key}`)}</h4>
                    <p className="grant-card-discount">{t('uni.discountValue', Number(item.discount) || 0)}</p>
                    <p className="grant-card-note">{asArray(item.faculties).length ? asArray(item.faculties).join(', ') : t('uni.allFaculties')}</p>
                  </div>
                  <Preliminary t={t} />
                </article>
              ))}
            </div>}

            <div className={`grant-row ${provinceGrant.available ? 'available' : 'unknown'}`}>
              <span className="grant-row-icon"><Landmark size={17} /></span>
              <div>
                <h4>{t('uni.provinceGrantTitle')}</h4>
                {provinceGrant.available ? (
                  <>
                    <p>{localized(provinceGrant.name, lang, '')}</p>
                    <p className="grant-card-note">
                      {provinceGrant.coverage && t(`uni.provinceGrantCoverage.${provinceGrant.coverage}`)}
                      {provinceGrant.note && <> · {t(`uni.provinceGrantNotes.${provinceGrant.note}`)}</>}
                    </p>
                  </>
                ) : <p className="grant-card-note">{t('uni.provinceGrantMissing')}</p>}
              </div>
              <span className={`grant-flag ${provinceGrant.available ? 'yes' : 'no'}`}>
                {provinceGrant.available ? <Check size={15} /> : <Minus size={15} />}
                {provinceGrant.available ? t('uni.yes') : t('uni.no')}
              </span>
            </div>

            <div className={`grant-row ${university.has_csc_scholarship ? 'available' : 'unknown'}`}>
              <span className="grant-row-icon"><Wallet size={17} /></span>
              <div>
                <h4>{t('uni.stateGrantTitle')}</h4>
                <p className="grant-card-note">{university.has_csc_scholarship ? t('uni.stateGrantYes') : t('uni.stateGrantNo')}</p>
                <button type="button" className="link-btn" onClick={onOpenStateGrant}>{t('uni.stateGrantLink')} <ChevronRight size={13} /></button>
              </div>
              <span className={`grant-flag ${university.has_csc_scholarship ? 'yes' : 'no'}`}>
                {university.has_csc_scholarship ? <Check size={15} /> : <Minus size={15} />}
                {university.has_csc_scholarship ? t('uni.yes') : t('uni.no')}
              </span>
            </div>
          </section>

          <section className="detail-section">
            <div className="detail-map-heading">
              <h3>{t('uni.reviewsTitle')}</h3>
              {reviews.length > 0 && <span className="filter-label">{t('uni.reviewsCount', reviews.length)}</span>}
            </div>
            {reviews.length === 0 ? (
              <p className="document-note">{t('uni.reviewsEmpty')}</p>
            ) : (
              <div className="review-list">
                {reviews.map(review => (
                  <article className="review-card" key={review.id}>
                    <header>
                      <span className="review-author">
                        <BadgeCheck size={15} />
                        {review.author_name || t(`uni.reviewStatuses.${review.author_status}`)}
                      </span>
                      <span className="review-score">{t('uni.scoreOutOf', toNumber(review.rating))}</span>
                    </header>
                    <p>{review.body}</p>
                    <footer>{t(`uni.reviewStatuses.${review.author_status}`)} · {formatDate(review.created_at, lang)}</footer>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="detail-section">
            <h3>{t('characteristics')}</h3>
            <dl className="spec-table">
              {specRows.map(row => (
                <div className="spec-row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd className={`${row.muted ? 'muted' : ''} ${row.strong ? 'strong' : ''} ${row.positive ? 'positive' : ''}`.trim()}>
                    {row.chips
                      ? <span className="uni-chips">{row.chips.map(specialty => <span className="uni-chip" key={specialty}>{specialtyLabel(specialty)}</span>)}</span>
                      : row.value}
                  </dd>
                </div>
              ))}
            </dl>
            {university.data_status === 'requires_verification' && <p className="data-status">{t('requiresVerification')}</p>}
          </section>

          {description && <section className="detail-section">
            <h3>{t('aboutUniversity')}</h3>
            <p className="detail-desc">{description}</p>
          </section>}

          {university.city_safety_description && <section className="detail-section">
            <h3>{t('safetyInCity')}</h3>
            <div className={`safety-panel safety-${safety || 'not_rated'}`}>
              <ShieldCheck size={22} />
              <div>
                <p className="safety-panel-level">{t(`safetyLevels.${safety || 'not_rated'}`)}</p>
                <p>{university.city_safety_description}</p>
              </div>
            </div>
          </section>}

          <section className="detail-section">
            <h3>{t('admissionDocuments')}</h3>
            <div className="document-grid">
              {t('medicalDocuments.items').map(item => <span className="document-item" key={item}><FileText size={16} /> {item}</span>)}
            </div>
            <p className="document-note">{t('medicalDocuments.title')}</p>
          </section>

          <section className="detail-section">
            <div className="detail-map-heading"><h3>{t('locationTitle')}</h3><a href={mapLink} target="_blank" rel="noreferrer">{t('openMap')}</a></div>
            <div className="detail-map">
              <iframe title={`${t('map')} ${university.name}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </section>
        </div>

        <aside className="detail-aside">
          <div className="detail-panel">
            {amount && <div className="panel-price">
              <span className="uni-price-label">{t('tuitionFrom')}</span>
              <p>{amount}</p>
              <span className="uni-price-note">{university.tuition} · {t('perYear')}</span>
            </div>}

            <div className="panel-facts">
              {siteRating && <span><span>{t('uni.score')}</span><strong>{t('uni.scoreOutOf', siteRating)}</strong></span>}
              {requirements.hsk && <span><span>{t('spec.hsk')}</span><strong>{requirements.hsk.full}</strong></span>}
              <span><span>{t('spec.csc')}</span><strong className={university.has_csc_scholarship ? 'positive' : 'muted'}>{university.has_csc_scholarship ? t('cscAvailable') : t('cscUnknown')}</strong></span>
              {formatRange(livingCost.campus, livingCost.currency, lang, t) && (
                <span><span>{t('uni.campusLiving')}</span><strong>{formatRange(livingCost.campus, livingCost.currency, lang, t)}</strong></span>
              )}
              <span><span>{t('applicationLabel')}</span><strong>{t('applicationFree')}</strong></span>
            </div>

            {agency ? (
              <div className="agency-info">
                <h3>{t('handledBy')}: {agency.name}</h3>
                <p>{t('email')}: {agency.email}</p>
                {agency.phone && <p>{t('phone')}: {agency.phone}</p>}
                {agency.website && <p><a href={`https://${agency.website}`} target="_blank" rel="noreferrer">{t('visitWebsite')}</a></p>}
              </div>
            ) : (
              <div className="panel-actions">
                <button className="apply-btn primary" onClick={handleSubmitApplication}>{user ? t('submitApplication') : t('wantToApply')} <ArrowRight size={17} /></button>
                <button type="button" className={`panel-link ${inCompare ? 'active' : ''}`} onClick={() => onToggleCompare(university.id)}>
                  {inCompare ? t('uni.compareRemove') : t('uni.compareAdd')} <GitCompare size={15} />
                </button>
                {sourceUrl && <a className="panel-link" href={sourceUrl} target="_blank" rel="noreferrer">{t('officialSource')} <ExternalLink size={15} /></a>}
              </div>
            )}
          </div>

          <div className="detail-verified">
            <ShieldCheck size={17} />
            <p>{verified && sourceHost ? t('verifiedWith', sourceHost, verified) : t('notVerifiedYet')}</p>
          </div>

          <div className="detail-verified detail-preliminary">
            <FileText size={17} />
            <p>{t('uni.preliminaryNote')}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function AuthModal({ t, onClose, onLogin }) {
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    const body = isLogin ? { email, password } : { email, password, fullName }

    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.user || data.userId) {
        onLogin(data.user || { id: data.userId, email })
      }
    } catch {
      alert(t('error'))
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isLogin ? t('signIn') : t('signUp')}</h3>
        <a className="google-auth-btn" href="/api/auth/google"><span className="google-g">G</span>{t('continueWithGoogle')}</a>
        <div className="auth-divider"><span>{t('or')}</span></div>
        <form onSubmit={handleSubmit}>
          {!isLogin && <input type="text" placeholder={t('fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} />}
          <input type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">{isLogin ? t('signInBtn') : t('createAccount')}</button>
        </form>
        <p className="auth-toggle">
          {isLogin ? t('dontHaveAccount') : t('haveAccount')}
          {' '}
          <button type="button" onClick={() => setIsLogin(!isLogin)}>{isLogin ? t('signUp') : t('signIn')}</button>
        </p>
      </div>
    </div>
  )
}

export default App
