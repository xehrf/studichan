import { useState, useEffect } from 'react'
import { Search, MapPin, LogOut, Upload, Download, X, ArrowRight, Check, SlidersHorizontal, ChevronDown, Camera, ShieldCheck, ExternalLink, FileText, ChevronRight } from 'lucide-react'
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

// Викисклад отдаёт превью любой ширины: карточке незачем тянуть файл на мегабайт.
const scaledImage = (url, width) => {
  if (!url || !url.includes('/thumb/')) return url
  return url.replace(/\/(\d+)px-([^/]+)$/, (match, current, file) => Number(current) > width ? `/${width}px-${file}` : match)
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
    setSelectedUniversity(university)
  }

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
        <button className="brand-lockup" onClick={() => setSelectedUniversity(null)}>
          <span className="brand-mark">C</span>
          <div className="header-title"><h1><strong>china</strong><span>course</span></h1><p>{t('title')}</p></div>
        </button>
        <div className="header-controls">
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
      {!selectedUniversity ? (
        <>
          {showQuestionnaire ? (
            <Questionnaire lang={lang} onLanguageChange={setLang} t={t} onComplete={handleQuestionnaireComplete} onSkip={() => setShowQuestionnaire(false)} />
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
                    <UniversityCard key={uni.id} university={uni} lang={lang} t={t} specialtyLabel={specialtyLabel} onOpen={handleViewDetails} />
                  ))}
                </div>
              )}
              </div>
            </>
          )}
        </>
      ) : (
        <UniversityDetail university={selectedUniversity} user={user} lang={lang} t={t} catalogueSize={universities.length} specialtyLabel={specialtyLabel} onBack={() => setSelectedUniversity(null)} onAuth={() => setShowAuth(true)} />
      )}

      {showAuth && <AuthModal t={t} onClose={() => setShowAuth(false)} onLogin={(userData) => { setUser(userData); setShowAuth(false) }} />}
      {canUseBrowserImporter && showImport && <ImportModal t={t} onClose={() => setShowImport(false)} onImported={fetchUniversities} />}
    </main>
  )
}

function UniversityCard({ university, lang, t, specialtyLabel, onOpen }) {
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
            <img src={scaledImage(images[0], 640)} alt={name} loading="lazy" />
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
          <button className="apply-btn" onClick={(event) => { event.stopPropagation(); onOpen(university) }}>
            {t('viewUniversity')} <ArrowRight size={16} />
          </button>
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

function UniversityDetail({ university, user, lang, t, catalogueSize, specialtyLabel, onBack, onAuth }) {
  const [agency, setAgency] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const images = imageList(university)
  const mapQuery = `${university.name}, ${university.city}, China`
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`

  useEffect(() => {
    setSelectedImage(0)
    if (university.agency_id) {
      fetchAgency()
    }
  }, [university])

  const fetchAgency = async () => {
    try {
      const res = await fetch(`/api/universities/${university.id}`)
      const data = await res.json()
      setAgency(data.agency)
    } catch (error) {
      console.error(error)
    }
  }

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
                <img className="detail-image" src={scaledImage(images[selectedImage] || images[0], 1280)} alt={name} />
                <span className="gallery-position">{t('galleryPosition', Math.min(selectedImage + 1, images.length), images.length)}</span>
              </div>
              {images.length > 1 && <div className="detail-thumbnails" aria-label={t('photoGallery')}>
                {visibleThumbs.map((image, index) => (
                  <button type="button" key={image} className={`detail-thumbnail ${index === selectedImage ? 'active' : ''}`} onClick={() => setSelectedImage(index)} aria-label={`${t('photoGallery')} ${index + 1}`}>
                    <img src={scaledImage(image, 260)} alt="" />
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
            <p className="detail-city"><MapPin size={14} /> {university.city} · {t(`regions.${university.region}`)}</p>
          </header>

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
              {requirements.hsk && <span><span>{t('spec.hsk')}</span><strong>{requirements.hsk.full}</strong></span>}
              <span><span>{t('spec.csc')}</span><strong className={university.has_csc_scholarship ? 'positive' : 'muted'}>{university.has_csc_scholarship ? t('cscAvailable') : t('cscUnknown')}</strong></span>
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
                {sourceUrl && <a className="panel-link" href={sourceUrl} target="_blank" rel="noreferrer">{t('officialSource')} <ExternalLink size={15} /></a>}
              </div>
            )}
          </div>

          <div className="detail-verified">
            <ShieldCheck size={17} />
            <p>{verified && sourceHost ? t('verifiedWith', sourceHost, verified) : t('notVerifiedYet')}</p>
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
