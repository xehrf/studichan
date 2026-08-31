import { useState, useEffect } from 'react'
import { Search, MapPin, TrendingUp, LogOut, Globe } from 'lucide-react'
import { useTranslation } from './translations'
import './App.css'

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
        uni.specialties.split(',').forEach(spec => {
          allSpecialties.add(spec.trim())
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
        const uniSpecs = u.specialties.split(',').map(s => s.trim())
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
                      <h3>{uni.name}</h3>
                      <p className="uni-location"><MapPin size={14} /> {t('location', uni.city)}</p>
                    </div>
                    {uni.ranking && <div className="ranking"><TrendingUp size={14} /> {t('ranking', uni.ranking)}</div>}
                  </div>
                  <p className="uni-tuition">{uni.tuition}</p>
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
    </main>
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
      <h2>{university.name}</h2>
      <p className="detail-city">{university.city} • {t('region', university.region)}</p>
      {university.description && <p className="detail-desc">{university.description}</p>}
      <div className="detail-section">
        <strong>{t('requirements')}:</strong>
        <p>{university.requirements}</p>
      </div>
      <div className="detail-section">
        <strong>{t('specialties')}:</strong>
        <p>{university.specialties}</p>
      </div>
      <div className="detail-section">
        <strong>{t('tuition')}:</strong>
        <p>{university.tuition}</p>
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
