import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, LogOut, Upload, Download, X, ArrowRight, Check, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from './translations'
import './App.css'

// The browser importer is deliberately local-only: a public import endpoint
// would let any visitor alter the production catalogue.
const canUseBrowserImporter = import.meta.env.DEV
const localized = (translations, lang, fallback = '') => translations?.[lang] || translations?.en || fallback
const localizedOrPending = (translations, lang, fallback, pending) => localized(translations, lang, fallback) || pending
const parseSpecialties = (specialties) => Array.isArray(specialties)
  ? specialties.map(spec => String(spec).trim()).filter(Boolean)
  : String(specialties || '').split(',').map(spec => spec.trim()).filter(Boolean)
const imageList = (university) => {
  const gallery = Array.isArray(university.image_gallery) ? university.image_gallery : []
  const galleryUrls = gallery.map(item => typeof item === 'string' ? item : item?.url).filter(Boolean)
  return [...new Set([university.image_url, ...galleryUrls].filter(Boolean))]
}

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
      {!selectedUniversity ? (
        <>
          {showQuestionnaire ? (
            <Questionnaire lang={lang} onLanguageChange={setLang} t={t} onComplete={handleQuestionnaireComplete} onSkip={() => setShowQuestionnaire(false)} />
          ) : (
            <>
              <header className="app-header">
            <div className="brand-lockup">
              <span className="brand-mark">C</span>
              <div className="header-title"><h1><strong>china</strong><span>course</span></h1><p>{t('title')}</p></div>
            </div>
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
              </header>

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

              <div className="results-meta"><p>{t('universitiesToExplore', filtered.length)}</p><button onClick={resetFilters}>{t('resetAll')}</button></div>

              {loading ? (
                <div className="loading">{t('loading')}</div>
              ) : (
                <div className="universities-list">
                  {filtered.length === 0 ? <div className="empty-state"><h3>{t('noResults')}</h3><p>{t('tryDifferentFilters')}</p><button onClick={resetFilters}>{t('resetAll')}</button></div> : filtered.map(uni => (
                    <div key={uni.id} className="uni-card">
                      <div className="uni-card-top">
                        <div className="uni-badges">{uni.ranking && <div className="ranking">{t('ranking', uni.ranking)} {t('world')}</div>}{uni.agency_id && <span className="agency-badge">{t('agencySupport')}</span>}</div>
                        <h3>{localized(uni.name_translations, lang, uni.name)}</h3>
                        <p className="uni-location"><MapPin size={14} /> {t('location', uni.city)} · {uni.region} {t('country')}</p>
                      </div>
                      <div className="uni-card-footer"><p className="uni-meta"><strong>{t('tuition')} </strong>{localized(uni.tuition_translations, lang, uni.tuition)} <span>{t('focus')} {parseSpecialties(uni.specialties).slice(0, 2).join(', ')}</span></p><button className="apply-btn" onClick={() => handleViewDetails(uni)}>{t('viewDetails')} <ArrowRight size={16} /></button></div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </>
          )}
        </>
      ) : (
        <UniversityDetail university={selectedUniversity} user={user} lang={lang} t={t} onBack={() => setSelectedUniversity(null)} onAuth={() => setShowAuth(true)} onLanguageChange={setLang} />
      )}

      {showAuth && <AuthModal t={t} onClose={() => setShowAuth(false)} onLogin={(userData) => { setUser(userData); setShowAuth(false) }} />}
      {canUseBrowserImporter && showImport && <ImportModal t={t} onClose={() => setShowImport(false)} onImported={fetchUniversities} />}
    </main>
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

function UniversityDetail({ university, user, lang, t, onBack, onAuth, onLanguageChange }) {
  const [agency, setAgency] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isGalleryPaused, setIsGalleryPaused] = useState(false)
  const [showCompactHeader, setShowCompactHeader] = useState(false)
  const galleryRef = useRef(null)
  const images = imageList(university)
  const mapQuery = `${university.name}, ${university.city}, China`
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`

  useEffect(() => {
    setSelectedImage(0)
    setShowCompactHeader(false)
    if (university.agency_id) {
      fetchAgency()
    }
  }, [university])

  useEffect(() => {
    if (images.length < 2 || isGalleryPaused) return undefined

    const slideshow = window.setInterval(() => {
      setSelectedImage(current => (current + 1) % images.length)
    }, 5000)

    return () => window.clearInterval(slideshow)
  }, [images.length, selectedImage, isGalleryPaused])

  const selectImage = (index) => {
    setSelectedImage((index + images.length) % images.length)
  }

  const handleDetailScroll = (event) => {
    const gallery = galleryRef.current
    const threshold = gallery ? gallery.offsetTop + gallery.offsetHeight - 72 : 0
    const nextVisible = event.currentTarget.scrollTop >= threshold
    setShowCompactHeader(current => current === nextVisible ? current : nextVisible)
  }

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

  return (
    <div className="detail-view" onScroll={handleDetailScroll}>
      <div className={`detail-sticky-header ${showCompactHeader ? 'visible' : ''}`}>
        <button type="button" className="detail-header-back" onClick={onBack} aria-label={t('back')}><ChevronLeft size={22} /></button>
        <strong>{localized(university.name_translations, lang, university.name)}</strong>
        <select className="detail-header-language" value={lang} onChange={(event) => onLanguageChange(event.target.value)} aria-label="Language">
          <option value="en">EN</option>
          <option value="ru">RU</option>
          <option value="kk">KK</option>
        </select>
      </div>
      <button className="back-btn" onClick={onBack}>{t('back')}</button>
      {images.length > 0 && <div ref={galleryRef} className="detail-gallery" onMouseEnter={() => setIsGalleryPaused(true)} onMouseLeave={() => setIsGalleryPaused(false)}>
        <div className="detail-slider">
          <img key={images[selectedImage] || images[0]} className="detail-image" src={images[selectedImage] || images[0]} alt={university.name} />
          {images.length > 1 && <>
            <button type="button" className="gallery-control gallery-control-prev" onClick={() => selectImage(selectedImage - 1)} aria-label="Previous photo"><ChevronLeft size={24} /></button>
            <button type="button" className="gallery-control gallery-control-next" onClick={() => selectImage(selectedImage + 1)} aria-label="Next photo"><ChevronRight size={24} /></button>
            <div className="gallery-pagination" aria-label={t('photoGallery')}>
              {images.map((image, index) => <button type="button" key={image} className={index === selectedImage ? 'active' : ''} onClick={() => selectImage(index)} aria-label={`${t('photoGallery')} ${index + 1}`} />)}
            </div>
          </>}
        </div>
      </div>}
      <h2>{localized(university.name_translations, lang, university.name)}</h2>
      <p className="detail-city">{university.city} • {t('region', university.region)}</p>
      <div className={`detail-safety safety-${university.city_safety || 'not_rated'}`}><strong>{t('citySafety')}:</strong> {t(`safetyLevels.${university.city_safety || 'not_rated'}`)}</div>
      {university.city_safety_description && <div className="detail-section safety-description"><strong>{t('citySafetyDetails')}:</strong><p>{university.city_safety_description}</p></div>}
      {localized(university.description_translations, lang, university.description) && <p className="detail-desc">{localized(university.description_translations, lang, university.description)}</p>}
      {university.source_url && <p className="detail-source"><a href={university.source_url} target="_blank" rel="noreferrer">{t('officialSource')}</a>{university.verified_at && ` • ${t('verifiedAt', university.verified_at)}`}</p>}
      {university.data_status === 'requires_verification' && <p className="data-status">{t('requiresVerification')}</p>}
      <div className="detail-section">
        <strong>{t('requirements')}:</strong>
        <p>{localizedOrPending(university.requirements_translations, lang, university.requirements, t('dataPending'))}</p>
      </div>
      <div className="detail-section medical-documents">
        <strong>{t('medicalDocuments.title')}</strong>
        <ul>
          {t('medicalDocuments.items').map(item => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div className="detail-section">
        <strong>{t('specialties')}:</strong>
        <p>{localizedOrPending(university.specialties_translations, lang, university.specialties, t('dataPending'))}</p>
      </div>
      <div className="detail-section">
        <strong>{t('tuition')}:</strong>
        <p>{localizedOrPending(university.tuition_translations, lang, university.tuition, t('dataPending'))}</p>
      </div>
      <div className="detail-map">
        <div className="detail-map-heading"><strong>{t('map')}</strong><a href={mapLink} target="_blank" rel="noreferrer">{t('openMap')}</a></div>
        <iframe title={`${t('map')} ${university.name}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>

      {agency ? (
        <div className="agency-info">
          <h3>{t('handledBy')}: {agency.name}</h3>
          <p>{t('email')}: {agency.email}</p>
          {agency.phone && <p>{t('phone')}: {agency.phone}</p>}
          {agency.website && <p><a href={`https://${agency.website}`} target="_blank">{t('visitWebsite')}</a></p>}
        </div>
      ) : (
        <button className="apply-btn" onClick={handleSubmitApplication}>{user ? t('submitApplication') : t('wantToApply')}</button>
      )}
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
