import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight, Award, CalendarDays, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Download, ExternalLink,
  BookOpen, Compass, FileText, Heart, Languages, Link2, MapPin, PenLine, Search, ShieldCheck, SlidersHorizontal, Sparkles, Upload,
  User, Users, Wallet, X,
} from 'lucide-react'
import { useTranslation, translations } from './translations'
import { BUDGETS, GROUPS, RATES_UPDATED, SPECIALTIES } from './catalog-config.js'
import {
  applyFilters, cityName, defaultFilters, filtersFromUrl, filtersToSearch, flagOf, formatKzt, formatKztRange,
  formatLocalRange, formatNumber, groupOf, imageList, isPlainClick, localized, requirementEntries, searchText,
  sortUniversities, specialtyKeys, storage, thumbUrl, universityName,
} from './catalog-utils.js'
import Cabinet from './Cabinet.jsx'
import AdminPage from './AdminPage.jsx'
import { CareerTest, IeltsTest } from './Tests.jsx'
import EssayCourse from './EssayCourse.jsx'
import './App.css'

// Импорт из браузера работает только локально: открытый маршрут импорта
// позволил бы любому посетителю менять опубликованный каталог.
const canUseBrowserImporter = import.meta.env.DEV
const PAGE_SIZE = 24
const groupIcons = { kz: '🇰🇿', cn: '🇨🇳', us: '🇺🇸', europe: '🇪🇺', world: '🌍' }

const initialLang = () => {
  try {
    const saved = localStorage.getItem('lang')
    if (['en', 'ru', 'kk'].includes(saved)) return saved
  } catch {
    // Без localStorage выбираем язык по браузеру.
  }
  const browser = (navigator.language || '').toLowerCase()
  if (browser.startsWith('kk')) return 'kk'
  if (browser.startsWith('en')) return 'en'
  return 'ru'
}

const staticPages = { '/cabinet': 'cabinet', '/tests/career': 'career', '/tests/ielts': 'ielts', '/admin': 'admin', '/essay': 'essay' }

const parseRoute = () => {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  if (staticPages[path]) return { page: staticPages[path] }
  const lesson = path.match(/^\/essay\/(\d+)$/)
  if (lesson) return { page: 'essay', lesson: Number(lesson[1]) }
  const match = path.match(/^\/u\/([^/]+)$/)
  return match ? { page: 'university', slug: decodeURIComponent(match[1]) } : { page: 'catalogue' }
}

function App() {
  const [universities, setUniversities] = useState([])
  const [status, setStatus] = useState('loading')
  const [route, setRoute] = useState(parseRoute)
  const [filters, setFilters] = useState(() => filtersFromUrl(window.location.search))
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [lang, setLang] = useState(initialLang)
  const [user, setUser] = useState(null)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [applications, setApplications] = useState([])
  const [favorites, setFavorites] = useState(() => storage.get('studichan:favorites', []))
  const [showQuestionnaire, setShowQuestionnaire] = useState(() => (
    !storage.get('studichan:onboarded', false) && window.location.pathname === '/' && !window.location.search
  ))
  const [showAuth, setShowAuth] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const catalogueScroll = useRef(0)
  const openedFromCatalogue = useRef(false)
  const t = useTranslation(lang)

  const fetchUniversities = useCallback(async () => {
    try {
      const response = await fetch('/api/universities')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setUniversities(await response.json())
      setStatus('ready')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }, [])

  const fetchApplications = useCallback(() => {
    fetch('/api/applications').then(response => response.json())
      .then(data => setApplications((data.applications || []).map(item => Number(item.university_id))))
      .catch(() => {})
  }, [])

  // После входа избранное из браузера переносится в аккаунт и дальше живёт там.
  const syncFavorites = useCallback(() => {
    fetch('/api/favorites/merge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: storage.get('studichan:favorites', []) }),
    }).then(response => (response.ok ? response.json() : null))
      .then(data => { if (data) setFavorites(data.favorites) })
      .catch(() => {})
  }, [])

  const signedIn = useCallback((userData) => {
    setUser(userData)
    fetchApplications()
    syncFavorites()
  }, [fetchApplications, syncFavorites])

  useEffect(() => {
    fetchUniversities()
    fetch('/api/auth/me').then(response => response.json()).then(data => {
      setGoogleEnabled(Boolean(data.googleEnabled))
      if (data.user) signedIn(data.user)
    }).catch(() => {})
  }, [fetchUniversities, signedIn])

  useEffect(() => {
    try { localStorage.setItem('lang', lang) } catch { /* язык просто не запомнится */ }
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => storage.set('studichan:favorites', favorites), [favorites])

  useEffect(() => {
    // Прокрутку каталога восстанавливаем сами (см. catalogueScroll).
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    const onPopState = () => {
      const next = parseRoute()
      setRoute(next)
      if (next.page === 'catalogue') setFilters(filtersFromUrl(window.location.search))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Фильтры каталога синхронизируются с адресной строкой без новых записей в истории.
  useEffect(() => {
    if (route.page !== 'catalogue') return
    const next = `/${filtersToSearch(filters)}`
    if (`${window.location.pathname}${window.location.search}` !== next) window.history.replaceState(null, '', next)
  }, [filters, route.page])

  const currentUniversity = route.page === 'university' ? universities.find(item => item.slug === route.slug) : null
  useEffect(() => {
    const titles = { cabinet: t('cabinet.title'), career: t('career.title'), ielts: t('ielts.title'), essay: t('essay.title'), admin: 'Админка' }
    document.title = currentUniversity
      ? `${universityName(currentUniversity, lang)} — Studichan`
      : titles[route.page] ? `${titles[route.page]} — Studichan` : `Studichan — ${t('brandTagline')}`
  }, [currentUniversity, route.page, lang, t])

  // После возврата из карточки вуза восстанавливаем прокрутку каталога.
  useEffect(() => {
    if (route.page === 'catalogue' && status === 'ready') {
      const top = catalogueScroll.current
      requestAnimationFrame(() => window.scrollTo(0, top))
    } else {
      window.scrollTo(0, 0)
    }
  }, [route, status])

  // Переход на внутреннюю страницу: /cabinet, /tests/ielts, /?s=cs и т.п.
  const navigate = (href) => {
    if (route.page === 'catalogue') catalogueScroll.current = window.scrollY
    window.history.pushState(null, '', href)
    const next = parseRoute()
    if (next.page === 'catalogue') {
      setFilters(filtersFromUrl(window.location.search))
      setVisibleCount(PAGE_SIZE)
      catalogueScroll.current = 0
    }
    openedFromCatalogue.current = false
    setRoute(next)
  }

  const updateFilters = (patch) => {
    setFilters(current => ({ ...current, ...patch }))
    setVisibleCount(PAGE_SIZE)
    catalogueScroll.current = 0
  }

  const openUniversity = (slug) => {
    if (route.page === 'university' && route.slug === slug) return
    if (route.page === 'catalogue') {
      catalogueScroll.current = window.scrollY
      openedFromCatalogue.current = true
    }
    window.history.pushState(null, '', `/u/${encodeURIComponent(slug)}`)
    setRoute({ page: 'university', slug })
  }

  const goToCatalogue = (patch) => {
    if (patch) {
      const next = { ...defaultFilters, ...patch }
      setFilters(next)
      setVisibleCount(PAGE_SIZE)
      catalogueScroll.current = 0
      window.history.pushState(null, '', `/${filtersToSearch(next)}`)
      setRoute({ page: 'catalogue' })
      return
    }
    if (route.page === 'university' && openedFromCatalogue.current) {
      openedFromCatalogue.current = false
      window.history.back()
      return
    }
    window.history.pushState(null, '', `/${filtersToSearch(filters)}`)
    setRoute({ page: 'catalogue' })
  }

  const toggleFavorite = (slug) => {
    const adding = !favorites.includes(slug)
    setFavorites(current => (adding ? [...current, slug] : current.filter(item => item !== slug)))
    if (user) fetch(`/api/favorites/${encodeURIComponent(slug)}`, { method: adding ? 'PUT' : 'DELETE' }).catch(() => {})
  }

  const saveTestResult = useCallback(async (type, result) => {
    try {
      const response = await fetch('/api/tests/results', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, result }),
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  const finishQuestionnaire = (answers) => {
    storage.set('studichan:onboarded', true)
    setShowQuestionnaire(false)
    if (answers) {
      goToCatalogue({
        group: answers.group,
        specialties: answers.specialty ? [answers.specialty] : [],
        budget: answers.budget,
        scholarship: answers.scholarship === 'yes',
      })
    }
  }

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
    setApplications([])
    navigate('/')
  }

  if (showQuestionnaire) {
    return (
      <main className="mobile-app questionnaire-mode">
        <Questionnaire lang={lang} onLanguageChange={setLang} t={t} onComplete={finishQuestionnaire} onSkip={() => finishQuestionnaire(null)} />
      </main>
    )
  }

  return (
    <main className="mobile-app">
      <header className="app-header">
        <a className="brand-lockup" href="/" onClick={(event) => { if (isPlainClick(event)) { event.preventDefault(); goToCatalogue({}) } }}>
          <span className="brand-mark">S</span>
          <div className="header-title"><h1><strong>studi</strong><span>chan</span></h1><p>{t('brandTagline')}</p></div>
        </a>
        <div className="header-controls">
          <button className="header-link" onClick={() => setShowQuestionnaire(true)}><Sparkles size={16} /><span>{t('findMatch')}</span></button>
          <a className={`header-link ${route.page === 'essay' ? 'active' : ''}`} href="/essay" onClick={(event) => { if (isPlainClick(event)) { event.preventDefault(); navigate('/essay') } }} aria-label={t('essayLink')}><PenLine size={16} /><span>{t('essayLink')}</span></a>
          <button className={`header-link ${filters.favorites && route.page === 'catalogue' ? 'active' : ''}`} onClick={() => goToCatalogue({ favorites: true })} aria-label={t('favorites')}>
            <Heart size={16} /><span>{t('favorites')}</span>{favorites.length > 0 && <span className="header-count">{favorites.length}</span>}
          </button>
          <select className="lang-select" value={lang} onChange={(event) => setLang(event.target.value)} aria-label={t('language')}>
            <option value="ru">RU</option>
            <option value="kk">KZ</option>
            <option value="en">EN</option>
          </select>
          {canUseBrowserImporter && <button className="icon-btn" title={t('importTitle')} onClick={() => setShowImport(true)}><Upload size={18} /></button>}
          {user
            ? <a className={`header-link ${route.page === 'cabinet' ? 'active' : ''}`} href="/cabinet" onClick={(event) => { if (isPlainClick(event)) { event.preventDefault(); navigate('/cabinet') } }} aria-label={t('cabinetLink')}><User size={16} /><span>{t('cabinetLink')}</span></a>
            : <button className="sign-in-btn" onClick={() => setShowAuth(true)}>{t('signIn')}</button>}
        </div>
      </header>

      {route.page === 'catalogue' && (
        <Catalogue
          universities={universities} status={status} filters={filters} onFilters={updateFilters} lang={lang} t={t}
          favorites={favorites} onToggleFavorite={toggleFavorite} onOpen={openUniversity} onNavigate={navigate}
          visibleCount={visibleCount} onShowMore={() => setVisibleCount(count => count + PAGE_SIZE)}
        />
      )}
      {route.page === 'cabinet' && (
        <Cabinet user={user} lang={lang} t={t} universities={universities} favorites={favorites} groupIcons={groupIcons}
          onAuth={() => setShowAuth(true)} onLogout={logout} onNavigate={navigate} onUserUpdate={setUser} />
      )}
      {route.page === 'career' && <CareerTest lang={lang} t={t} user={user} onAuth={() => setShowAuth(true)} onNavigate={navigate} onSaveResult={saveTestResult} />}
      {route.page === 'ielts' && <IeltsTest lang={lang} t={t} user={user} universities={universities} onAuth={() => setShowAuth(true)} onNavigate={navigate} onSaveResult={saveTestResult} />}
      {route.page === 'essay' && <EssayCourse lessonId={route.lesson} lang={lang} t={t} onNavigate={navigate} />}
      {route.page === 'admin' && <AdminPage user={user} t={t} />}
      {route.page === 'university' && (
        <UniversityDetail
          key={route.slug} slug={route.slug} listItem={currentUniversity} universities={universities}
          user={user} applications={applications} lang={lang} t={t} favorites={favorites}
          onToggleFavorite={toggleFavorite} onOpen={openUniversity} onBack={goToCatalogue}
          onAuth={() => setShowAuth(true)} onApplied={(id) => setApplications(current => [...current, id])}
        />
      )}

      {showAuth && <AuthModal t={t} googleEnabled={googleEnabled} onClose={() => setShowAuth(false)} onLogin={(userData) => { signedIn(userData); setShowAuth(false) }} />}
      {canUseBrowserImporter && showImport && <ImportModal t={t} onClose={() => setShowImport(false)} onImported={fetchUniversities} />}
    </main>
  )
}

function Catalogue({ universities, status, filters, onFilters, lang, t, favorites, onToggleFavorite, onOpen, onNavigate, visibleCount, onShowMore }) {
  const [showFilters, setShowFilters] = useState(false)
  const [showSpecialties, setShowSpecialties] = useState(false)
  const [specialtySearch, setSpecialtySearch] = useState('')

  const countryNames = useMemo(() => Object.values(translations).map(item => item.countries), [])
  const searchIndex = useMemo(() => new Map(universities.map(item => [item.slug, searchText(item, countryNames)])), [universities, countryNames])
  const filtered = useMemo(() => sortUniversities(applyFilters(universities, filters, { favorites, searchIndex }), filters.sort, lang),
    [universities, filters, favorites, searchIndex, lang])

  const groupCounts = useMemo(() => {
    const counts = { all: universities.length }
    for (const item of universities) counts[groupOf(item)] = (counts[groupOf(item)] || 0) + 1
    return counts
  }, [universities])
  const countriesInGroup = useMemo(() => {
    const counts = new Map()
    for (const item of universities) if (groupOf(item) === filters.group) counts.set(item.country, (counts.get(item.country) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [universities, filters.group])
  const languageOptions = useMemo(() => {
    const counts = new Map()
    for (const item of universities) for (const code of item.languages || []) counts.set(code, (counts.get(code) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([code]) => code)
  }, [universities])
  const countryCount = useMemo(() => new Set(universities.map(item => item.country)).size, [universities])

  const showRegions = filters.country === 'CN' || (filters.group === 'cn' && !filters.country)
  const specialtyLabel = (key) => t(`specialtyNames.${key}`)
  const toggleSpecialty = (key) => onFilters({
    specialties: filters.specialties.includes(key) ? filters.specialties.filter(item => item !== key) : [...filters.specialties, key],
  })

  const activeChips = [
    filters.group && { key: 'group', label: `${groupIcons[filters.group]} ${t(`groups.${filters.group}`)}`, clear: { group: '', country: '', region: '' } },
    filters.country && { key: 'country', label: `${flagOf(filters.country)} ${t(`countries.${filters.country}`)}`, clear: { country: '', region: '' } },
    filters.region && { key: 'region', label: t(`regions.${filters.region}`), clear: { region: '' } },
    ...filters.specialties.map(key => ({ key: `s-${key}`, label: specialtyLabel(key), clear: { specialties: filters.specialties.filter(item => item !== key) } })),
    filters.budget && { key: 'budget', label: t('budgetUpTo', formatKzt(filters.budget, lang)), clear: { budget: 0 } },
    filters.language && { key: 'language', label: t(`languageNames.${filters.language}`), clear: { language: '' } },
    filters.scholarship && { key: 'scholarship', label: t('scholarshipOnly'), clear: { scholarship: false } },
    filters.favorites && { key: 'favorites', label: t('favoritesOnly'), clear: { favorites: false } },
    filters.ielts && { key: 'ielts', label: t('ieltsUpTo', filters.ielts.toFixed(1)), clear: { ielts: 0 } },
  ].filter(Boolean)
  const extraFilterCount = filters.specialties.length + [filters.budget, filters.language, filters.scholarship, filters.favorites, filters.ielts].filter(Boolean).length
  const promoLink = (href) => (event) => { if (isPlainClick(event)) { event.preventDefault(); onNavigate(href) } }

  const resetAll = () => onFilters({ ...defaultFilters, sort: filters.sort })
  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="catalogue-content">
      <section className="catalogue-intro">
        <div><p className="catalogue-eyebrow">{t('catalogueEyebrow')}</p><h2>{t('catalogueHeading')}</h2></div>
        {universities.length > 0 && <p>{t('catalogueDescription', universities.length, countryCount)}</p>}
      </section>

      <div className="promo-grid">
        <a className="promo-card" href="/tests/career" onClick={promoLink('/tests/career')}>
          <Compass size={24} /><span><strong>{t('promo.careerTitle')}</strong><small>{t('promo.careerText')}</small><em>{t('promo.careerCta')} <ArrowRight size={14} /></em></span>
        </a>
        <a className="promo-card" href="/tests/ielts" onClick={promoLink('/tests/ielts')}>
          <BookOpen size={24} /><span><strong>{t('promo.ieltsTitle')}</strong><small>{t('promo.ieltsText')}</small><em>{t('promo.ieltsCta')} <ArrowRight size={14} /></em></span>
        </a>
        <a className="promo-card" href="/essay" onClick={promoLink('/essay')}>
          <PenLine size={24} /><span><strong>{t('promo.essayTitle')}</strong><small>{t('promo.essayText')}</small><em>{t('promo.essayCta')} <ArrowRight size={14} /></em></span>
        </a>
      </div>

      <div className="search-section">
        <label className="search-input">
          <Search size={18} />
          <input type="search" placeholder={t('searchPlaceholder')} value={filters.q} onChange={(event) => onFilters({ q: event.target.value })} aria-label={t('searchPlaceholder')} />
          {filters.q && <button type="button" className="clear-search" onClick={() => onFilters({ q: '' })} aria-label={t('clear')}><X size={16} /></button>}
        </label>

        <div className="group-tabs" role="tablist">
          {['', ...GROUPS].map(group => (
            <button key={group || 'all'} role="tab" aria-selected={filters.group === group} className={`group-tab ${filters.group === group ? 'active' : ''}`}
              onClick={() => onFilters({ group, country: '', region: '' })}>
              {group && <span className="group-icon">{groupIcons[group]}</span>}
              <span>{t(`groups.${group || 'all'}`)}</span>
              {status === 'ready' && <small>{groupCounts[group || 'all'] || 0}</small>}
            </button>
          ))}
        </div>

        {filters.group && countriesInGroup.length > 1 && (
          <div className="chip-row" aria-label={t('spec.country')}>
            <button className={`filter-chip ${!filters.country ? 'active' : ''}`} onClick={() => onFilters({ country: '', region: '' })}>{t('allInGroup')}</button>
            {countriesInGroup.map(([code, count]) => (
              <button key={code} className={`filter-chip ${filters.country === code ? 'active' : ''}`} onClick={() => onFilters({ country: code, region: '' })}>
                {flagOf(code)} {t(`countries.${code}`)} <small>{count}</small>
              </button>
            ))}
          </div>
        )}

        {showRegions && (
          <div className="chip-row" aria-label={t('spec.region')}>
            <button className={`filter-chip ${!filters.region ? 'active' : ''}`} onClick={() => onFilters({ region: '' })}>{t('allRegions')}</button>
            {['North', 'East', 'Central', 'South', 'West'].map(region => (
              <button key={region} className={`filter-chip ${filters.region === region ? 'active' : ''}`} onClick={() => onFilters({ region })}>{t(`regions.${region}`)}</button>
            ))}
          </div>
        )}

        <button className={`filters-toggle ${showFilters ? 'open' : ''}`} onClick={() => setShowFilters(value => !value)} aria-expanded={showFilters}>
          <SlidersHorizontal size={16} /><span>{showFilters ? t('hideFilters') : t('filters')}</span>
          {extraFilterCount > 0 && <span className="selected-filter-count">{extraFilterCount}</span>}
          <ChevronDown size={15} />
        </button>

        <div className={`filter-bar ${showFilters ? 'open' : ''}`}>
          <div className="filter-field specialty-field">
            <span className="filter-label">{t('specialtyFilter')}</span>
            <button className={`specialty-toggle ${showSpecialties ? 'open' : ''}`} onClick={() => setShowSpecialties(value => !value)} aria-expanded={showSpecialties}>
              <span>{filters.specialties.length ? filters.specialties.map(specialtyLabel).join(', ') : t('anySpecialty')}</span><ChevronDown size={15} />
            </button>
            {showSpecialties && (
              <div className="specialty-panel">
                <div className="specialty-search"><Search size={16} /><input type="search" value={specialtySearch} onChange={(event) => setSpecialtySearch(event.target.value)} placeholder={t('specialtySearch')} /></div>
                <div className="specialty-options">
                  {SPECIALTIES.filter(key => specialtyLabel(key).toLowerCase().includes(specialtySearch.toLowerCase())).map(key => (
                    <button key={key} className={`specialty-option ${filters.specialties.includes(key) ? 'active' : ''}`} onClick={() => toggleSpecialty(key)} aria-pressed={filters.specialties.includes(key)}>
                      <span className="specialty-check">{filters.specialties.includes(key) && <Check size={13} />}</span><span>{specialtyLabel(key)}</span>
                    </button>
                  ))}
                  {!SPECIALTIES.some(key => specialtyLabel(key).toLowerCase().includes(specialtySearch.toLowerCase())) && <p className="no-specialties">{t('noSpecialties')}</p>}
                </div>
              </div>
            )}
          </div>
          <label className="filter-field">
            <span className="filter-label">{t('budgetFilter')}</span>
            <select value={filters.budget} onChange={(event) => onFilters({ budget: Number(event.target.value) })}>
              <option value={0}>{t('anyBudget')}</option>
              {BUDGETS.map(value => <option key={value} value={value}>{t('budgetUpTo', formatKzt(value, lang))}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span className="filter-label">{t('languageFilter')}</span>
            <select value={filters.language} onChange={(event) => onFilters({ language: event.target.value })}>
              <option value="">{t('anyLanguage')}</option>
              {languageOptions.map(code => <option key={code} value={code}>{t(`languageNames.${code}`)}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span className="filter-label">{t('sortLabel')}</span>
            <select value={filters.sort} onChange={(event) => onFilters({ sort: event.target.value })}>
              <option value="ranking">{t('sortOptions.ranking')}</option>
              <option value="tuition">{t('sortOptions.tuition')}</option>
              <option value="name">{t('sortOptions.name')}</option>
            </select>
          </label>
          <div className="filter-toggles">
            <label className="toggle"><input type="checkbox" checked={filters.scholarship} onChange={(event) => onFilters({ scholarship: event.target.checked })} /><span>{t('scholarshipOnly')}</span></label>
            {(favorites.length > 0 || filters.favorites) && <label className="toggle"><input type="checkbox" checked={filters.favorites} onChange={(event) => onFilters({ favorites: event.target.checked })} /><span>{t('favoritesOnly')} ({favorites.length})</span></label>}
          </div>
        </div>
      </div>

      <div className="results-meta">
        {status === 'ready' && <p><strong>{t('resultsCount', filtered.length)}</strong></p>}
        {activeChips.length > 0 && (
          <div className="active-filters">
            {activeChips.map(chip => <button key={chip.key} className="active-chip" onClick={() => onFilters(chip.clear)} aria-label={`${t('remove')}: ${chip.label}`}>{chip.label}<X size={13} /></button>)}
            <button className="reset-link" onClick={resetAll}>{t('resetAll')}</button>
          </div>
        )}
      </div>

      {status === 'loading' && <div className="loading">{t('loading')}</div>}
      {status === 'error' && <div className="empty-state"><h3>{t('loadError')}</h3></div>}
      {status === 'ready' && (
        filtered.length === 0 ? (
          <div className="empty-state"><h3>{t('noResults')}</h3><p>{t('tryDifferentFilters')}</p><button onClick={resetAll}>{t('resetAll')}</button></div>
        ) : (
          <>
            <div className="universities-list">
              {visible.map(university => (
                <UniversityCard key={university.slug} university={university} lang={lang} t={t} onOpen={onOpen}
                  isFavorite={favorites.includes(university.slug)} onToggleFavorite={onToggleFavorite} />
              ))}
            </div>
            {filtered.length > visible.length && <button className="show-more" onClick={onShowMore}>{t('showMore', filtered.length - visible.length)}</button>}
          </>
        )
      )}
    </div>
  )
}

const TuitionBlock = ({ university, lang, t, large = false }) => {
  const kzt = formatKztRange(university.tuition_min_kzt, university.tuition_max_kzt, lang)
  const local = university.tuition_currency !== 'KZT'
    ? formatLocalRange(university.tuition_min_local, university.tuition_max_local, university.tuition_currency, lang)
    : ''
  return (
    <div className={large ? 'panel-price' : 'uni-price'}>
      <span className="uni-price-label">{t('facts.tuition')}</span>
      {kzt ? <p>{kzt}</p> : <p className="price-unknown">{t('tuitionUnknown')}</p>}
      {local && <span className="uni-price-note">{local} · {t('perYear')}</span>}
    </div>
  )
}

const FavoriteButton = ({ active, onToggle, t, className = '' }) => (
  <button type="button" className={`favorite-btn ${active ? 'active' : ''} ${className}`} aria-pressed={active}
    onClick={(event) => { event.stopPropagation(); onToggle() }} title={active ? t('saved') : t('save')} aria-label={active ? t('saved') : t('save')}>
    <Heart size={18} fill={active ? 'currentColor' : 'none'} />
  </button>
)

// «IT и компьютерные науки» → «IT и компьютерные науки», «Natural Sciences» → «natural sciences».
const lowerWords = (text) => text.split(' ').map(word => (/^[A-ZА-ЯЁ]{2,}$/.test(word) ? word : word.toLowerCase())).join(' ')

const requirementLabel = (key, t) => {
  const label = t(`requirementLabels.${key}`)
  return label === `requirementLabels.${key}` ? key : label
}

function UniversityCard({ university, lang, t, onOpen, isFavorite, onToggleFavorite }) {
  const name = universityName(university, lang)
  const href = `/u/${university.slug}`
  const requirements = requirementEntries(university).slice(0, 2)
  const specialties = specialtyKeys(university).slice(0, 2)
  const languages = (university.languages || []).slice(0, 3).map(code => t(`languageNames.${code}`)).join(', ')
  const scholarship = (university.scholarships || [])[0]
  const open = (event) => {
    // Ссылки внутри карточки и сама карточка ведут в одно место: событие не
    // должно всплыть и открыть вуз второй раз (лишняя запись в истории).
    event.stopPropagation()
    if (!isPlainClick(event)) return
    event.preventDefault()
    onOpen(university.slug)
  }

  return (
    <article className="uni-card" onClick={open}>
      <div className="uni-card-photo">
        {university.image_url ? (
          <>
            <img src={thumbUrl(university.image_url, 500)} alt="" loading="lazy" decoding="async" />
            {university.photo_count > 1 && <span className="photo-count"><Camera size={12} /> {t('photosCount', university.photo_count)}</span>}
          </>
        ) : (
          <div className="photo-empty"><span className="photo-empty-flag">{flagOf(university.country)}</span><span>{t('photosPending')}</span></div>
        )}
        <FavoriteButton active={isFavorite} onToggle={() => onToggleFavorite(university.slug)} t={t} className="on-photo" />
      </div>
      <div className="uni-card-body">
        <div className="uni-card-main">
          <p className="uni-location"><span className="flag">{flagOf(university.country)}</span> {t(`countries.${university.country}`)} · {cityName(university, lang)}</p>
          <h3><a href={href} onClick={open}>{name}</a></h3>
          <div className="uni-badges">
            {university.ranking_world_label && <span className="ranking">{t('qsRank', university.ranking_world_label)}</span>}
            {university.country === 'CN' && university.ranking && <span className="world-rank">{t('rankInCountry', university.ranking)}</span>}
            <span className="world-rank">{t(`types.${university.university_type}`)}</span>
          </div>
          {languages && <p className="uni-languages"><Languages size={13} /> {t('teachingIn', languages)}</p>}
          <div className="uni-chips">
            {requirements.map(([key, value]) => <span className="uni-chip" key={key}>{requirementLabel(key, t)} {value}</span>)}
            {scholarship && <span className="uni-chip scholarship-chip"><Award size={12} /> {t(`scholarshipNames.${scholarship}`)}</span>}
            {specialties.map(key => <span className="uni-chip muted-chip" key={key}>{t(`specialtyNames.${key}`)}</span>)}
          </div>
        </div>
        <div className="uni-card-aside">
          <TuitionBlock university={university} lang={lang} t={t} />
          <a className="apply-btn" href={href} onClick={open}>{t('viewUniversity')} <ArrowRight size={16} /></a>
        </div>
      </div>
    </article>
  )
}

function UniversityDetail({ slug, listItem, universities, user, applications, lang, t, favorites, onToggleFavorite, onOpen, onBack, onAuth, onApplied }) {
  const [details, setDetails] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [applyState, setApplyState] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/universities/${encodeURIComponent(slug)}`)
      .then(response => {
        if (response.status === 404) { setNotFound(true); return null }
        return response.ok ? response.json() : null
      })
      .then(data => { if (data && !cancelled) setDetails(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [slug])

  const university = details ? { ...listItem, ...details } : listItem
  if (!university) {
    return (
      <div className="detail-view">
        {notFound
          ? <div className="empty-state"><h3>{t('noResults')}</h3><button onClick={() => onBack({})}>{t('catalogueCrumb')}</button></div>
          : <div className="loading">{t('loading')}</div>}
      </div>
    )
  }

  const name = universityName(university, lang)
  const city = cityName(university, lang)
  const country = t(`countries.${university.country}`)
  const images = imageList(university)
  const image = images[Math.min(selectedImage, images.length - 1)]
  const specialties = specialtyKeys(university)
  const requirements = requirementEntries(university)
  const scholarships = university.scholarships || []
  const languages = (university.languages || []).map(code => t(`languageNames.${code}`)).join(', ')
  const safety = university.city_safety && university.city_safety !== 'not_rated' ? university.city_safety : null
  const isFavorite = favorites.includes(university.slug)
  const applied = applications.includes(Number(university.id))
  const group = groupOf(university)
  const tipKey = translations.en.countryTips[university.country] ? university.country : group === 'europe' ? 'europe' : 'default'
  const documents = t(`documents.${translations.en.documents[university.country] ? university.country : 'default'}`)
  const hasCoordinates = Number.isFinite(university.latitude) && Number.isFinite(university.longitude)
  const mapQuery = hasCoordinates ? `${university.latitude},${university.longitude}` : `${university.name_translations?.en || university.name}, ${university.city_translations?.en || university.city}, ${translations.en.countries[university.country]}`
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
  const summary = t('summary', {
    name, type: university.university_type, city, country, founded: university.founded,
    students: university.students_count ? formatNumber(university.students_count, lang) : null,
    specialties: specialties.map(key => lowerWords(t(`specialtyNames.${key}`))).join(', '),
    qs: university.ranking_world_label,
  })
  const customDescription = localized(university.description_translations, lang, '')

  const similar = universities
    .filter(item => item.slug !== university.slug && item.country === university.country)
    .map(item => ({ item, shared: specialtyKeys(item).filter(key => specialties.includes(key)).length }))
    .sort((a, b) => b.shared - a.shared || (a.item.ranking_world ?? Infinity) - (b.item.ranking_world ?? Infinity))
    .slice(0, 3)
    .map(({ item }) => item)

  const apply = async () => {
    if (!user) { onAuth(); return }
    setApplyState('sending')
    try {
      const response = await fetch('/api/applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ universityId: Number(university.id) }),
      })
      if (response.status === 401) { setApplyState(''); onAuth(); return }
      if (response.status === 409) { setApplyState('exists'); onApplied(Number(university.id)); return }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setApplyState('sent')
      onApplied(Number(university.id))
    } catch {
      setApplyState('error')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(t('shareLink'), window.location.href)
    }
  }

  const specRows = [
    { label: t('spec.country'), value: `${flagOf(university.country)} ${country}` },
    { label: t('spec.city'), value: city },
    university.country === 'CN' && university.region && t(`regions.${university.region}`) !== `regions.${university.region}` && { label: t('spec.region'), value: t(`regions.${university.region}`) },
    { label: t('spec.type'), value: t(`types.${university.university_type}`) },
    { label: t('spec.rankWorld'), value: university.ranking_world_label || t('notRanked'), muted: !university.ranking_world_label },
    university.country === 'CN' && university.ranking && { label: t('spec.rankNational'), value: `№${university.ranking}` },
    languages && { label: t('spec.languages'), value: languages },
    specialties.length > 0 && { label: t('spec.specialties'), chips: specialties.map(key => t(`specialtyNames.${key}`)) },
    university.founded && { label: t('spec.founded'), value: university.founded },
    university.students_count > 0 && { label: t('spec.students'), value: `≈ ${formatNumber(university.students_count, lang)}` },
    university.name_local && { label: t('spec.localName'), value: university.name_local },
  ].filter(Boolean)

  return (
    <div className="detail-view">
      <nav className="detail-crumbs">
        <a className="back-btn" href="/" onClick={(event) => { if (isPlainClick(event)) { event.preventDefault(); onBack() } }}><ChevronLeft size={14} /> {t('catalogueCrumb')}</a>
        <ChevronRight size={13} />
        <button className="crumb-link" onClick={() => onBack({ group, country: university.country })}>{flagOf(university.country)} {country}</button>
        <ChevronRight size={13} />
        <span className="current">{name}</span>
      </nav>

      <div className="detail-layout">
        <div className="detail-main">
          {images.length > 0 ? (
            <div className="detail-gallery">
              <div className="detail-stage">
                <img className="detail-image" src={image.url} alt={name} />
                {images.length > 1 && <>
                  <button className="gallery-arrow prev" onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)} aria-label={t('prevPhoto')}><ChevronLeft size={22} /></button>
                  <button className="gallery-arrow next" onClick={() => setSelectedImage((selectedImage + 1) % images.length)} aria-label={t('nextPhoto')}><ChevronRight size={22} /></button>
                  <span className="gallery-position">{t('galleryPosition', selectedImage + 1, images.length)}</span>
                </>}
              </div>
              {images.length > 1 && <div className="detail-thumbnails" aria-label={t('photoGallery')}>
                {images.map((item, index) => (
                  <button type="button" key={item.url} className={`detail-thumbnail ${index === selectedImage ? 'active' : ''}`} onClick={() => setSelectedImage(index)} aria-label={`${t('photoGallery')} ${index + 1}`}>
                    <img src={thumbUrl(item.url, 330)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>}
              {image.source && <a className="photo-credit" href={image.source} target="_blank" rel="noreferrer">{t('photoCredit')}</a>}
            </div>
          ) : (
            <div className="detail-gallery detail-gallery-empty"><span className="photo-empty-flag">{flagOf(university.country)}</span><span>{t('photosPending')}</span></div>
          )}

          <header className="detail-headline">
            <div className="uni-badges">
              {university.ranking_world_label && <span className="ranking">{t('qsRank', university.ranking_world_label)}</span>}
              {university.country === 'CN' && university.ranking && <span className="world-rank">{t('rankInCountry', university.ranking)}</span>}
              {safety && <span className={`safety-badge safety-${safety}`}>{t('citySafety')}: {t(`safetyLevels.${safety}`)}</span>}
            </div>
            <h2>{name}</h2>
            {university.name_local && <p className="detail-local-name">{university.name_local}</p>}
            <p className="detail-city"><MapPin size={14} /> {city}, {country}</p>
          </header>

          <div className="fact-tiles">
            <div className="fact-tile"><Award size={18} /><span>{t('facts.qs')}</span><strong>{university.ranking_world_label || '—'}</strong></div>
            <div className="fact-tile"><Wallet size={18} /><span>{t('facts.tuition')}</span><strong>{formatKztRange(university.tuition_min_kzt, university.tuition_max_kzt, lang) || '—'}</strong></div>
            <div className="fact-tile"><Languages size={18} /><span>{t('facts.language')}</span><strong>{languages || '—'}</strong></div>
            {university.founded
              ? <div className="fact-tile"><CalendarDays size={18} /><span>{t('facts.founded')}</span><strong>{university.founded}</strong></div>
              : <div className="fact-tile"><Users size={18} /><span>{t('facts.students')}</span><strong>{university.students_count ? `≈ ${formatNumber(university.students_count, lang)}` : '—'}</strong></div>}
          </div>

          <section className="detail-section">
            <h3>{t('aboutUniversity')}</h3>
            <p className="detail-desc">{summary}</p>
            {customDescription && <p className="detail-desc">{customDescription}</p>}
            {university.wikipedia_url && <a className="text-link" href={university.wikipedia_url} target="_blank" rel="noreferrer">{t('readOnWikipedia')} <ExternalLink size={13} /></a>}
          </section>

          <section className="detail-section">
            <h3>{t('howToApply')}</h3>
            <p className="detail-desc">{translations.en.universityTips[university.slug] ? t(`universityTips.${university.slug}`) : t(`countryTips.${tipKey}`)}</p>
            <h4>{t('requirementsTitle')}</h4>
            {requirements.length > 0 ? (
              <div className="requirement-grid">
                {requirements.map(([key, value]) => <div className="requirement-item" key={key}><span>{requirementLabel(key, t)}</span><strong>{value}</strong></div>)}
              </div>
            ) : <p className="muted-text">{t('noRequirementsData')}</p>}
            <h4>{t('documentsTitle')}</h4>
            <div className="document-grid">
              {documents.map(item => <span className="document-item" key={item}><FileText size={16} /> {item}</span>)}
            </div>
            {university.country === 'CN' && (
              <details className="medical-details">
                <summary>{t('medicalTitle')}</summary>
                <ul>{t('medicalDocuments').map(item => <li key={item}>{item}</li>)}</ul>
              </details>
            )}
          </section>

          {scholarships.length > 0 && (
            <section className="detail-section">
              <h3>{t('scholarshipsTitle')}</h3>
              <div className="scholarship-list">
                {scholarships.map(key => (
                  <div className="scholarship-item" key={key}><Award size={18} /><div><strong>{t(`scholarshipNames.${key}`)}</strong><p>{t(`scholarshipDescriptions.${key}`)}</p></div></div>
                ))}
              </div>
            </section>
          )}

          <section className="detail-section">
            <h3>{t('characteristics')}</h3>
            <dl className="spec-table">
              {specRows.map(row => (
                <div className="spec-row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd className={row.muted ? 'muted' : ''}>
                    {row.chips ? <span className="uni-chips">{row.chips.map(chip => <span className="uni-chip" key={chip}>{chip}</span>)}</span> : row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {university.city_safety_description && (
            <section className="detail-section">
              <h3>{t('safetyInCity')}</h3>
              <div className={`safety-panel safety-${safety || 'not_rated'}`}>
                <ShieldCheck size={22} />
                <div><p className="safety-panel-level">{t(`safetyLevels.${safety || 'not_rated'}`)}</p><p>{university.city_safety_description}</p></div>
              </div>
            </section>
          )}

          <section className="detail-section">
            <div className="detail-map-heading"><h3>{t('locationTitle')}</h3><a href={mapLink} target="_blank" rel="noreferrer">{t('openMap')}</a></div>
            <div className="detail-map">
              <iframe title={`${t('map')}: ${name}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </section>

          {similar.length > 0 && (
            <section className="detail-section">
              <h3>{t('similarTitle')}</h3>
              <div className="similar-grid">
                {similar.map(item => (
                  <a key={item.slug} className="similar-card" href={`/u/${item.slug}`} onClick={(event) => { if (isPlainClick(event)) { event.preventDefault(); onOpen(item.slug) } }}>
                    {item.image_url ? <img src={thumbUrl(item.image_url, 500)} alt="" loading="lazy" /> : <span className="photo-empty-flag">{flagOf(item.country)}</span>}
                    <span className="similar-body">
                      <strong>{universityName(item, lang)}</strong>
                      <small>{cityName(item, lang)}{item.ranking_world_label ? ` · QS ${item.ranking_world_label}` : ''}</small>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="detail-aside">
          <div className="detail-panel">
            <TuitionBlock university={university} lang={lang} t={t} large />
            <div className="panel-facts">
              <span><span>{t('spec.type')}</span><strong>{t(`types.${university.university_type}`)}</strong></span>
              <span><span>{t('facts.qs')}</span><strong className={university.ranking_world_label ? '' : 'muted'}>{university.ranking_world_label || t('notRanked')}</strong></span>
              {scholarships.length > 0 && <span><span>{t('scholarshipsTitle')}</span><strong className="positive">{scholarships.length}</strong></span>}
            </div>
            <div className="panel-actions">
              {applied || applyState === 'sent' || applyState === 'exists' ? (
                <p className="apply-status success"><Check size={16} /> {applyState === 'sent' ? t('applicationSubmitted') : t('applicationExists')}</p>
              ) : (
                <>
                  <button className="apply-btn primary" onClick={apply} disabled={applyState === 'sending'}>{user ? t('submitApplication') : t('wantToApply')} <ArrowRight size={17} /></button>
                  <p className="apply-note">{t('applicationNote')}</p>
                  {applyState === 'error' && <p className="apply-status error">{t('applicationError')}</p>}
                </>
              )}
              {university.website && <a className="panel-link" href={university.website} target="_blank" rel="noreferrer">{t('officialSource')} <ExternalLink size={15} /></a>}
              <div className="panel-secondary">
                <button className={`secondary-btn ${isFavorite ? 'active' : ''}`} onClick={() => onToggleFavorite(university.slug)} aria-pressed={isFavorite}>
                  <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? t('saved') : t('save')}
                </button>
                <button className="secondary-btn" onClick={copyLink}><Link2 size={16} /> {copied ? t('linkCopied') : t('shareLink')}</button>
              </div>
            </div>
          </div>
          <div className="detail-verified">
            <ShieldCheck size={17} />
            <p>{t('dataDisclaimer', RATES_UPDATED)}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Questionnaire({ lang, onLanguageChange, t, onComplete, onSkip }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ group: null, specialty: null, budget: null, scholarship: null })

  const questions = [
    { key: 'group', title: t('questionnaire.destinationTitle'), options: [...GROUPS, ''], label: (option) => option ? `${groupIcons[option]} ${t(`groups.${option}`)}` : t('questionnaire.anyDestination') },
    { key: 'specialty', title: t('questionnaire.specialtyTitle'), options: [...SPECIALTIES.filter(key => key !== 'agriculture'), ''], label: (option) => option ? t(`specialtyNames.${option}`) : t('questionnaire.anySpecialty') },
    { key: 'budget', title: t('questionnaire.budgetTitle'), options: [...BUDGETS, 0], label: (option) => t(`questionnaire.budgets.${option}`) },
    { key: 'scholarship', title: t('questionnaire.scholarshipTitle'), options: ['yes', 'no'], label: (option) => t(`questionnaire.scholarships.${option}`) },
  ]
  const question = questions[step]
  const isLast = step === questions.length - 1

  const continueQuestion = () => {
    if (answers[question.key] === null) return
    if (isLast) onComplete(answers)
    else setStep(step + 1)
  }

  return (
    <section className={`questionnaire ${question.options.length > 6 ? 'questionnaire-long' : ''}`} aria-label={t('questionnaire.title')}>
      <div className="questionnaire-hero">
        <div className="questionnaire-brand"><span className="brand-mark">S</span><span className="questionnaire-wordmark"><strong>studi</strong><span>chan</span></span></div>
        <div className="questionnaire-hero-copy">
          <p className="hero-support">{t('questionnaire.heroSupport')}</p>
          <h1>{t('questionnaire.heroTitleStart')}<br />{t('questionnaire.heroTitlePlace')}<br /><em>{t('questionnaire.heroTitleEnd')}</em></h1>
          <p className="hero-footer"><span>■</span> {t('questionnaire.builtAroundGoals')}</p>
        </div>
      </div>
      <div className="questionnaire-panel">
        <div className="questionnaire-topline">
          <span className="eyebrow">{t('questionnaire.matchProfile')}</span>
          <div className="questionnaire-tools">
            <select className="lang-select questionnaire-lang-select" value={lang} onChange={(event) => onLanguageChange(event.target.value)} aria-label={t('language')}>
              <option value="ru">RU</option><option value="kk">KZ</option><option value="en">EN</option>
            </select>
            <button className="skip-btn" onClick={onSkip}>{t('questionnaire.skip')}</button>
          </div>
        </div>
        <div className="questionnaire-progress-meta"><span>{step + 1}<small> / {questions.length}</small></span></div>
        <div className="progress-track"><span style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
        <div className="question-block">
          <div className="questionnaire-heading"><div><p className="questionnaire-step">{t('questionnaire.step', step + 1, questions.length)}</p><h2>{question.title}</h2></div></div>
          <div className="answer-grid">
            {question.options.map((option, index) => (
              <button type="button" key={String(option) || 'any'} className={`answer-btn ${answers[question.key] === option ? 'selected' : ''}`}
                onClick={() => setAnswers(current => ({ ...current, [question.key]: option }))} aria-pressed={answers[question.key] === option}>
                <span className="answer-index">{index + 1}</span><span className="answer-label">{question.label(option)}</span><span className="answer-indicator">{answers[question.key] === option && <Check size={16} />}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="questionnaire-actions">
          {step > 0 ? <button type="button" className="back-question" onClick={() => setStep(step - 1)}><ChevronLeft size={16} /> {t('questionnaire.back')}</button> : <p>{t('questionnaire.answerHint')}</p>}
          <button type="button" className="continue-btn" onClick={continueQuestion} disabled={answers[question.key] === null}>{isLast ? t('questionnaire.seeMatches') : t('questionnaire.continue')} <ArrowRight size={17} /></button>
        </div>
      </div>
    </section>
  )
}

function ImportModal({ t, onClose, onImported }) {
  const [csv, setCsv] = useState('')
  const [status, setStatus] = useState('')
  const [importing, setImporting] = useState(false)

  const template = `name,city,region,ranking,specialties,requirements,tuition,description,website,source_url,verified_at\nTsinghua University,Beijing,North,1,"engineering, cs",HSK 4+,30000 CNY/year,Top research university,https://www.tsinghua.edu.cn,https://www.tsinghua.edu.cn,2026-08-31`

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
      if (!response.ok) throw new Error(data.error || 'Import failed')
      setStatus(`${t('importSuccess', data.imported)} ${data.skipped.length ? t('skippedRows', data.skipped.join(', ')) : ''}`)
      onImported()
    } catch (error) { setStatus(error.message) }
    finally { setImporting(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal import-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title"><h3>{t('importTitle')}</h3><button className="icon-btn" onClick={onClose} aria-label={t('close')}><X size={18} /></button></div>
        <p className="import-hint">{t('importHint')}</p>
        <button className="template-btn" onClick={downloadTemplate}><Download size={16} /> {t('downloadTemplate')}</button>
        <form onSubmit={importCsv}>
          <textarea value={csv} onChange={(event) => setCsv(event.target.value)} required placeholder="name,city,region,..." rows="10" />
          <button type="submit" disabled={importing}>{importing ? t('importing') : t('importAction')}</button>
        </form>
        {status && <p className="import-status">{status}</p>}
        <p className="columns-help">{t('requiredColumns')} <code>name, city, region</code>. {t('optionalColumns')} city_safety (low, medium, high), ranking, specialties, requirements, tuition, description, website, source_url, verified_at.</p>
      </div>
    </div>
  )
}

function AuthModal({ t, googleEnabled, onClose, onLogin }) {
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isLogin && password.length < 8) { setError(t('authErrors.short')); return }
    setSending(true); setError('')
    try {
      const response = await fetch(isLogin ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email, password } : { email, password, fullName }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok && data.user) { onLogin(data.user); return }
      if (response.status === 401) setError(t('authErrors.invalid'))
      else if (data.error === 'Email already registered') setError(t('authErrors.exists'))
      else if (/8 characters/.test(data.error || '')) setError(t('authErrors.short'))
      else setError(t('authErrors.generic'))
    } catch {
      setError(t('authErrors.generic'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title"><h3 id="auth-title">{isLogin ? t('signIn') : t('signUp')}</h3><button className="icon-btn" onClick={onClose} aria-label={t('close')}><X size={18} /></button></div>
        {googleEnabled && <>
          <a className="google-auth-btn" href="/api/auth/google"><span className="google-g">G</span>{t('continueWithGoogle')}</a>
          <div className="auth-divider"><span>{t('or')}</span></div>
        </>}
        <form onSubmit={handleSubmit}>
          {!isLogin && <input type="text" autoComplete="name" placeholder={t('fullName')} value={fullName} onChange={(event) => setFullName(event.target.value)} />}
          <input type="email" required autoComplete="email" placeholder={t('email')} value={email} onChange={(event) => setEmail(event.target.value)} />
          <input type="password" required autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={isLogin ? t('password') : `${t('password')} — ${t('passwordHint').toLowerCase()}`} value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={sending}>{isLogin ? t('signInBtn') : t('createAccount')}</button>
        </form>
        <p className="auth-toggle">
          {isLogin ? t('dontHaveAccount') : t('haveAccount')}{' '}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError('') }}>{isLogin ? t('signUp') : t('signIn')}</button>
        </p>
      </div>
    </div>
  )
}

export default App
