import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Check, Circle, CircleCheck, ClipboardList, Compass, LogOut, Shield } from 'lucide-react'
import { BUDGETS, GROUPS, SPECIALTIES } from './catalog-config.js'
import { cityName, flagOf, formatKzt, isPlainClick, localeTag, thumbUrl, universityName } from './catalog-utils.js'
import { CAREER_TYPE_INFO } from './tests/career.js'

const STUDY_LEVELS = ['bachelor', 'master', 'language', 'foundation']
const IELTS_SCORES = Array.from({ length: 11 }, (_, index) => 4 + index * 0.5)
const thisYear = new Date().getFullYear()
const GRADUATION_YEARS = Array.from({ length: 9 }, (_, index) => thisYear - 3 + index)
const TABS = ['profile', 'universities', 'tests']

const formatDate = (value, lang) => new Date(value).toLocaleDateString(localeTag[lang] || 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

const emptyForm = (user, profile) => ({
  full_name: user?.full_name || '',
  phone: profile?.phone || '',
  city: profile?.city || '',
  graduation_year: profile?.graduation_year || '',
  study_level: profile?.study_level || '',
  target_groups: profile?.target_groups || [],
  specialties: profile?.specialties || [],
  budget: profile?.budget ?? '',
  unt_score: profile?.unt_score ?? '',
  ielts_score: profile?.ielts_score ?? '',
  contact_consent: Boolean(profile?.contact_consent),
})

const Link = ({ href, onNavigate, className, children }) => (
  <a className={className} href={href} onClick={(event) => { if (isPlainClick(event)) { event.preventDefault(); onNavigate(href) } }}>{children}</a>
)

export default function Cabinet({ user, lang, t, universities, favorites, onAuth, onLogout, onNavigate, onUserUpdate, groupIcons }) {
  const [data, setData] = useState(null)
  const [form, setForm] = useState(() => emptyForm(user, null))
  const [saveState, setSaveState] = useState('')
  const [tab, setTab] = useState(() => {
    const value = new URLSearchParams(window.location.search).get('tab')
    return TABS.includes(value) ? value : 'profile'
  })

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetch('/api/cabinet').then(response => (response.ok ? response.json() : null)).then(result => {
      if (!result || cancelled) return
      setData(result)
      setForm(emptyForm(user, result.profile))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [user])

  const switchTab = (next) => {
    setTab(next)
    window.history.replaceState(null, '', `/cabinet?tab=${next}`)
  }

  if (!user) {
    return (
      <div className="cabinet-page">
        <div className="test-intro">
          <span className="test-icon"><Shield size={28} /></span>
          <h2>{t('cabinet.signInTitle')}</h2>
          <p>{t('cabinet.signInText')}</p>
          <button className="continue-btn" onClick={onAuth}>{t('signIn')} <ArrowRight size={17} /></button>
        </div>
      </div>
    )
  }

  const update = (patch) => { setForm(current => ({ ...current, ...patch })); setSaveState('') }
  const toggleIn = (field, value) => update({ [field]: form[field].includes(value) ? form[field].filter(item => item !== value) : [...form[field], value] })

  const saveProfile = async (event) => {
    event.preventDefault()
    setSaveState('saving')
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          graduation_year: form.graduation_year === '' ? null : Number(form.graduation_year),
          budget: form.budget === '' ? null : Number(form.budget),
          unt_score: form.unt_score === '' ? null : Number(form.unt_score),
          ielts_score: form.ielts_score === '' ? null : Number(form.ielts_score),
        }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setData(await response.json())
      onUserUpdate({ ...user, full_name: form.full_name.trim() })
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  const bySlug = new Map(universities.map(item => [item.slug, item]))
  const saved = favorites.map(slug => bySlug.get(slug)).filter(Boolean)
  const applications = data?.applications || []
  const career = data?.results.career
  const ieltsResults = data?.results.ielts || []
  const profile = data?.profile
  const steps = [
    { key: 'profile', done: Boolean(profile && (profile.phone || profile.target_groups?.length)), href: '/cabinet?tab=profile' },
    { key: 'career', done: Boolean(career), href: '/tests/career' },
    { key: 'ielts', done: ieltsResults.length > 0, href: '/tests/ielts' },
    { key: 'saved', done: favorites.length > 0, href: '/' },
    { key: 'apply', done: applications.length > 0, href: '/?fav=1' },
  ]
  const typeInfo = (type) => CAREER_TYPE_INFO[type]?.[lang] || CAREER_TYPE_INFO[type]?.ru

  return (
    <div className="cabinet-page">
      <header className="cabinet-header">
        <div>
          <p className="catalogue-eyebrow">{t('cabinet.title')}</p>
          <h2>{t('cabinet.greeting', user.full_name?.split(' ')[0])}</h2>
          <p className="muted-text">{user.email}</p>
        </div>
        <div className="cabinet-header-actions">
          {user.is_admin && <Link className="secondary-btn" href="/admin" onNavigate={onNavigate}><ClipboardList size={16} /> Админка</Link>}
          <button className="secondary-btn" onClick={onLogout}><LogOut size={16} /> {t('cabinet.logout')}</button>
        </div>
      </header>

      <section className="steps-panel">
        <h3>{t('cabinet.stepsTitle')} <small>{steps.filter(step => step.done).length} / {steps.length}</small></h3>
        <ol className="steps-list">
          {steps.map(step => (
            <li key={step.key} className={step.done ? 'done' : ''}>
              {step.done ? <CircleCheck size={18} /> : <Circle size={18} />}
              {step.done ? <span>{t(`cabinet.steps.${step.key}`)}</span> : <Link href={step.href} onNavigate={(href) => (href.startsWith('/cabinet') ? switchTab('profile') : onNavigate(href))}>{t(`cabinet.steps.${step.key}`)}</Link>}
            </li>
          ))}
        </ol>
      </section>

      <div className="cabinet-tabs" role="tablist">
        {TABS.map(key => <button key={key} role="tab" aria-selected={tab === key} className={`group-tab ${tab === key ? 'active' : ''}`} onClick={() => switchTab(key)}>{t(`cabinet.tabs.${key}`)}</button>)}
      </div>

      {tab === 'profile' && (
        <form className="profile-form" onSubmit={saveProfile}>
          <div className="form-grid">
            <label className="form-field"><span>{t('cabinet.profile.fullName')}</span><input value={form.full_name} onChange={(event) => update({ full_name: event.target.value })} autoComplete="name" /></label>
            <label className="form-field"><span>{t('cabinet.profile.phone')}</span><input type="tel" value={form.phone} placeholder={t('cabinet.profile.phoneHint')} onChange={(event) => update({ phone: event.target.value })} autoComplete="tel" /></label>
            <label className="form-field"><span>{t('cabinet.profile.city')}</span><input value={form.city} onChange={(event) => update({ city: event.target.value })} autoComplete="address-level2" /></label>
            <label className="form-field"><span>{t('cabinet.profile.graduationYear')}</span>
              <select value={form.graduation_year} onChange={(event) => update({ graduation_year: event.target.value })}>
                <option value="">{t('cabinet.profile.notSelected')}</option>
                {GRADUATION_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label className="form-field"><span>{t('cabinet.profile.studyLevel')}</span>
              <select value={form.study_level} onChange={(event) => update({ study_level: event.target.value })}>
                <option value="">{t('cabinet.profile.notSelected')}</option>
                {STUDY_LEVELS.map(level => <option key={level} value={level}>{t(`cabinet.profile.studyLevels.${level}`)}</option>)}
              </select>
            </label>
            <label className="form-field"><span>{t('cabinet.profile.budget')}</span>
              <select value={form.budget} onChange={(event) => update({ budget: event.target.value })}>
                <option value="">{t('anyBudget')}</option>
                {BUDGETS.map(value => <option key={value} value={value}>{t('budgetUpTo', formatKzt(value, lang))}</option>)}
              </select>
            </label>
            <label className="form-field"><span>{t('cabinet.profile.untScore')}</span><input type="number" min="0" max="140" inputMode="numeric" value={form.unt_score} onChange={(event) => update({ unt_score: event.target.value })} /></label>
            <label className="form-field"><span>{t('cabinet.profile.ieltsScore')}</span>
              <select value={form.ielts_score} onChange={(event) => update({ ielts_score: event.target.value })}>
                <option value="">{t('cabinet.profile.ieltsNone')}</option>
                {IELTS_SCORES.map(score => <option key={score} value={score}>{score.toFixed(1)}</option>)}
              </select>
            </label>
          </div>
          <fieldset className="form-field">
            <legend>{t('cabinet.profile.targetGroups')}</legend>
            <div className="chip-row wrap">
              {GROUPS.map(group => <button type="button" key={group} className={`filter-chip ${form.target_groups.includes(group) ? 'active' : ''}`} aria-pressed={form.target_groups.includes(group)} onClick={() => toggleIn('target_groups', group)}>{groupIcons[group]} {t(`groups.${group}`)}</button>)}
            </div>
          </fieldset>
          <fieldset className="form-field">
            <legend>{t('cabinet.profile.specialties')}</legend>
            <div className="chip-row wrap">
              {SPECIALTIES.map(key => <button type="button" key={key} className={`filter-chip ${form.specialties.includes(key) ? 'active' : ''}`} aria-pressed={form.specialties.includes(key)} onClick={() => toggleIn('specialties', key)}>{t(`specialtyNames.${key}`)}</button>)}
            </div>
          </fieldset>
          <label className="consent-field">
            <input type="checkbox" checked={form.contact_consent} onChange={(event) => update({ contact_consent: event.target.checked })} />
            <span>{t('cabinet.profile.consent')}<small>{t('cabinet.profile.consentNote')}</small></span>
          </label>
          <div className="profile-actions">
            <button type="submit" className="continue-btn" disabled={saveState === 'saving'}>{saveState === 'saving' ? t('cabinet.profile.saving') : t('cabinet.profile.save')}</button>
            {saveState === 'saved' && <span className="apply-status success"><Check size={16} /> {t('cabinet.profile.saved')}</span>}
            {saveState === 'error' && <span className="apply-status error">{t('cabinet.profile.error')}</span>}
          </div>
        </form>
      )}

      {tab === 'universities' && (
        <div className="cabinet-section">
          <h3>{t('cabinet.applicationsTitle')}</h3>
          {applications.length === 0 ? <p className="muted-text">{t('cabinet.noApplications')}</p> : (
            <div className="cabinet-list">
              {applications.map(item => {
                const university = bySlug.get(item.slug)
                return (
                  <Link key={item.slug} className="cabinet-row" href={`/u/${item.slug}`} onNavigate={onNavigate}>
                    <span>{flagOf(university?.country)} {university ? universityName(university, lang) : item.slug}</span>
                    <span className={`status-pill status-${item.status}`}>{t(`cabinet.statuses.${item.status}`)}</span>
                  </Link>
                )
              })}
            </div>
          )}
          <h3>{t('cabinet.savedTitle')}</h3>
          {saved.length === 0 ? (
            <p className="muted-text">{t('cabinet.noSaved')} <Link className="text-link" href="/" onNavigate={onNavigate}>{t('cabinet.browseCatalogue')}</Link></p>
          ) : (
            <div className="similar-grid">
              {saved.map(item => (
                <Link key={item.slug} className="similar-card" href={`/u/${item.slug}`} onNavigate={onNavigate}>
                  {item.image_url ? <img src={thumbUrl(item.image_url, 500)} alt="" loading="lazy" /> : <span className="photo-empty-flag">{flagOf(item.country)}</span>}
                  <span className="similar-body"><strong>{universityName(item, lang)}</strong><small>{flagOf(item.country)} {cityName(item, lang)}{item.ranking_world_label ? ` · QS ${item.ranking_world_label}` : ''}</small></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'tests' && (
        <div className="test-summary-grid">
          <div className="test-summary">
            <Compass size={22} />
            <h3>{t('cabinet.careerTitle')}</h3>
            {career ? (
              <>
                <p className="muted-text">{t('cabinet.takenOn', formatDate(career.created_at, lang))}</p>
                <p><strong>{career.result.top.map(type => typeInfo(type)?.title).join(' + ')}</strong></p>
                <div className="uni-chips">{career.result.specialties.map(key => <span className="uni-chip" key={key}>{t(`specialtyNames.${key}`)}</span>)}</div>
                <Link className="text-link" href={`/?s=${career.result.specialties.join(',')}`} onNavigate={onNavigate}>{t('career.seeUniversities')} <ArrowRight size={13} /></Link>
              </>
            ) : <p className="muted-text">{t('cabinet.careerEmpty')}</p>}
            <Link className="secondary-btn" href="/tests/career" onNavigate={onNavigate}>{career ? t('cabinet.retake') : t('cabinet.take')}</Link>
          </div>
          <div className="test-summary">
            <BookOpen size={22} />
            <h3>{t('cabinet.ieltsTitle')}</h3>
            {ieltsResults.length > 0 ? (
              <>
                <ul className="ielts-history">
                  {ieltsResults.map(item => <li key={item.created_at}><strong>≈ {Number(item.result.band).toFixed(1)}</strong><span>{t('ielts.correct', item.result.correct, item.result.total)} · {formatDate(item.created_at, lang)}</span></li>)}
                </ul>
                <Link className="text-link" href={`/?i=${ieltsResults[0].result.band}`} onNavigate={onNavigate}>{t('ielts.seeUniversities')} <ArrowRight size={13} /></Link>
              </>
            ) : <p className="muted-text">{t('cabinet.ieltsEmpty')}</p>}
            <Link className="secondary-btn" href="/tests/ielts" onNavigate={onNavigate}>{ieltsResults.length ? t('cabinet.retake') : t('cabinet.take')}</Link>
          </div>
        </div>
      )}
    </div>
  )
}
