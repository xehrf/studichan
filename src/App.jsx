import { useState, useEffect } from 'react'
import { Search, MapPin, TrendingUp, LogOut, Upload, Download, X } from 'lucide-react'
import { useTranslation } from './translations'
import './App.css'

// The browser importer is deliberately local-only: a public import endpoint
// would let any visitor alter the production catalogue.
const canUseBrowserImporter = import.meta.env.DEV
const localized = (translations, lang, fallback = '') => translations?.[lang] || translations?.en || fallback

function App() {
  const [universities, setUniversities] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState([])
  const [uniqueSpecialties, setUniqueSpecialties] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedUniversity, setSelectedUniversity] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en')
  const t = useTranslation(lang)

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  useEffect(() => {
    fetchUniversities()
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
        uni.specialties.split(',').map(spec => spec.trim()).filter(Boolean).forEach(spec => {
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
        const uniSpecs = u.specialties.split(',').map(s => s.trim()).filter(Boolean)
        return specialties.some(spec => uniSpecs.includes(spec))
      })
    }
    setFiltered(result)
  }

  const handleApply = (university) => {
    if (!user) {
      setSelectedUniversity(university)
      setShowAuth(true)
    }
  }

  return (
    <main className="mobile-app">
      {!selectedUniversity ? (
        <>
          <header className="app-header">
            <div className="header-title">
              <h1>中国大学</h1>
              <p>{t('title')}</p>
            </div>
            <div className="header-controls">
              <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="en">EN</option>
                <option value="ru">РУ</option>
                <option value="kk">KK</option>
              </select>
              {canUseBrowserImporter && <button className="icon-btn" title="Импорт университетов" onClick={() => setShowImport(true)}><Upload size={18} /></button>}
              {user && <button className="logout-btn" onClick={() => setUser(null)}><LogOut size={18} /></button>}
            </div>
          </header>

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
                <p className="filter-label">{t('specialties')}:</p>
                <div className="specialty-options">
                  {uniqueSpecialties.map(spec => (
                    <button
                      key={spec}
                      className={`filter-btn specialty-btn ${selectedSpecialties.includes(spec) ? 'active' : ''}`}
                      onClick={() => handleSpecialtyFilter(spec)}
                    >
                      {t(`specialtyNames.${spec}`) || spec}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading">{t('loading')}</div>
          ) : (
            <div className="universities-list">
              {filtered.map(uni => (
                <div key={uni.id} className="uni-card">
                  <div className="uni-header">
                    <div>
                      <h3>{localized(uni.name_translations, lang, uni.name)}</h3>
                      <p className="uni-location"><MapPin size={14} /> {t('location', uni.city)}</p>
                    </div>
                    {uni.ranking && <div className="ranking"><TrendingUp size={14} /> {t('ranking', uni.ranking)}</div>}
                  </div>
                  <p className="uni-tuition">{localized(uni.tuition_translations, lang, uni.tuition)}</p>
                  {uni.agency_id ? (
                    <div className="agency-badge">{t('agencyHandled', uni.students_count)}</div>
                  ) : (
                    <button className="apply-btn" onClick={() => handleApply(uni)}>{t('learnMore')}</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <UniversityDetail university={selectedUniversity} user={user} lang={lang} t={t} onBack={() => setSelectedUniversity(null)} onAuth={() => setShowAuth(true)} />
      )}

      {showAuth && <AuthModal university={selectedUniversity} lang={lang} t={t} onClose={() => setShowAuth(false)} onLogin={(userData) => { setUser(userData); setShowAuth(false) }} />}
      {canUseBrowserImporter && showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchUniversities} />}
    </main>
  )
}

function ImportModal({ onClose, onImported }) {
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
      setStatus(`Готово: добавлено или обновлено ${data.imported}. ${data.skipped.length ? `Пропущены строки: ${data.skipped.join(', ')}` : ''}`)
      onImported()
    } catch (error) { setStatus(error.message) }
    finally { setImporting(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title"><h3>Импорт университетов</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>
        <p className="import-hint">Скопируй таблицу из Excel или Google Sheets и вставь её сюда. Университет с тем же названием будет обновлён.</p>
        <button className="template-btn" onClick={downloadTemplate}><Download size={16} /> Скачать шаблон CSV</button>
        <form onSubmit={importCsv}>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} required placeholder="name,city,region,..." rows="10" />
          <button type="submit" disabled={importing}>{importing ? 'Импортируем…' : 'Импортировать'}</button>
        </form>
        {status && <p className="import-status">{status}</p>}
        <p className="columns-help">Обязательные колонки: <code>name, city, region</code>. Дополнительно: ranking, specialties, requirements, tuition, description, website, source_url, verified_at.</p>
      </div>
    </div>
  )
}

function UniversityDetail({ university, user, lang, t, onBack, onAuth }) {
  const [agency, setAgency] = useState(null)

  useEffect(() => {
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
      alert('Application submitted! The agency will contact you.')
    } catch (error) {
      alert('Error submitting application')
    }
  }

  return (
    <div className="detail-view">
      <button className="back-btn" onClick={onBack}>{t('back')}</button>
      {university.image_url && <img className="detail-image" src={university.image_url} alt={university.name} />}
      <h2>{localized(university.name_translations, lang, university.name)}</h2>
      <p className="detail-city">{university.city} • {t('region', university.region)}</p>
      {localized(university.description_translations, lang, university.description) && <p className="detail-desc">{localized(university.description_translations, lang, university.description)}</p>}
      <div className="detail-section">
        <strong>{t('requirements')}:</strong>
        <p>{localized(university.requirements_translations, lang, university.requirements)}</p>
      </div>
      <div className="detail-section">
        <strong>{t('specialties')}:</strong>
        <p>{localized(university.specialties_translations, lang, university.specialties)}</p>
      </div>
      <div className="detail-section">
        <strong>{t('tuition')}:</strong>
        <p>{localized(university.tuition_translations, lang, university.tuition)}</p>
      </div>

      {agency ? (
        <div className="agency-info">
          <h3>{t('handledBy')}: {agency.name}</h3>
          <p>Email: {agency.email}</p>
          {agency.phone && <p>Phone: {agency.phone}</p>}
          {agency.website && <p><a href={`https://${agency.website}`} target="_blank">{t('visitWebsite')}</a></p>}
        </div>
      ) : (
        <button className="apply-btn" onClick={handleSubmitApplication}>{user ? t('submitApplication') : t('wantToApply')}</button>
      )}
    </div>
  )
}

function AuthModal({ university, lang, t, onClose, onLogin }) {
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
    } catch (error) {
      alert(t('error'))
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isLogin ? t('signIn') : t('signUp')}</h3>
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
