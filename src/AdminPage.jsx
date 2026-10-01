import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { flagOf, formatKzt } from './catalog-utils.js'

// Админка владельца сайта: заявки и профили абитуриентов. Доступ — по
// ADMIN_EMAILS на сервере; интерфейс только на русском.
const STATUS_LABELS = { pending: 'Новая', contacted: 'Связались', in_progress: 'В работе', enrolled: 'Поступил', rejected: 'Закрыта' }
const LEVELS = { bachelor: 'Бакалавриат', master: 'Магистратура', language: 'Язык', foundation: 'Foundation' }
const GROUPS = { kz: 'Казахстан', cn: 'Китай', us: 'США', europe: 'Европа', world: 'Другие' }
const formatDate = (value) => (value ? new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')

export default function AdminPage({ user, t }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.is_admin) return
    fetch('/api/admin/leads')
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then(setData)
      .catch(err => setError(err.message))
  }, [user])

  if (!user?.is_admin) return <div className="cabinet-page"><div className="empty-state"><h3>Нет доступа</h3><p>Страница доступна только администраторам сайта.</p></div></div>
  if (error) return <div className="cabinet-page"><div className="empty-state"><h3>Не удалось загрузить данные</h3><p>{error}</p></div></div>
  if (!data) return <div className="cabinet-page"><div className="loading">Загрузка…</div></div>

  const changeStatus = async (id, status) => {
    const response = await fetch(`/api/admin/applications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (response.ok) setData(current => ({ ...current, applications: current.applications.map(item => (item.id === id ? { ...item, status } : item)) }))
  }

  const consented = data.users.filter(item => item.contact_consent).length
  const newApplications = data.applications.filter(item => item.status === 'pending').length

  return (
    <div className="cabinet-page admin-page">
      <header className="cabinet-header">
        <div><p className="catalogue-eyebrow">Studichan</p><h2>Заявки и абитуриенты</h2></div>
        <a className="secondary-btn" href="/api/admin/leads.csv"><Download size={16} /> Скачать для Excel</a>
      </header>

      <div className="fact-tiles">
        <div className="fact-tile"><span>Регистраций</span><strong>{data.users.length}</strong></div>
        <div className="fact-tile"><span>Согласились на связь</span><strong>{consented}</strong></div>
        <div className="fact-tile"><span>Заявок всего</span><strong>{data.applications.length}</strong></div>
        <div className="fact-tile"><span>Новых заявок</span><strong>{newApplications}</strong></div>
      </div>

      <section className="cabinet-section">
        <h3>Заявки</h3>
        {data.applications.length === 0 ? <p className="muted-text">Заявок пока нет.</p> : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>Дата</th><th>Абитуриент</th><th>Контакты</th><th>Вуз</th><th>Статус</th></tr></thead>
              <tbody>
                {data.applications.map(item => (
                  <tr key={item.id}>
                    <td>{formatDate(item.created_at)}</td>
                    <td>{item.full_name || '—'}<small>{item.city || ''}</small></td>
                    <td><a href={`mailto:${item.email}`}>{item.email}</a>{item.phone && <small><a href={`tel:${item.phone}`}>{item.phone}</a></small>}{!item.contact_consent && <small className="warn">нет согласия на передачу партнёрам</small>}</td>
                    <td><a href={`/u/${item.slug}`} target="_blank" rel="noreferrer">{flagOf(item.country)} {item.university}</a></td>
                    <td>
                      <select value={item.status} onChange={(event) => changeStatus(item.id, event.target.value)}>
                        {data.statuses.map(status => <option key={status} value={status}>{STATUS_LABELS[status] || status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="cabinet-section">
        <h3>Абитуриенты</h3>
        <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>Обновлён</th><th>Абитуриент</th><th>Цель</th><th>Бюджет</th><th>Баллы</th><th>Тесты</th><th>Согласие</th></tr></thead>
            <tbody>
              {data.users.map(item => (
                <tr key={item.user_id}>
                  <td>{formatDate(item.updated_at || item.registered_at)}</td>
                  <td>{item.full_name || '—'}<small><a href={`mailto:${item.email}`}>{item.email}</a></small>{item.phone && <small>{item.phone}</small>}{item.city && <small>{item.city}</small>}</td>
                  <td>{LEVELS[item.study_level] || '—'}<small>{(item.target_groups || []).map(group => GROUPS[group] || group).join(', ')}</small><small>{(item.specialties || []).map(key => t(`specialtyNames.${key}`)).join(', ')}</small>{item.graduation_year && <small>выпуск {item.graduation_year}</small>}</td>
                  <td>{item.budget ? `до ${formatKzt(item.budget, 'ru')}` : '—'}</td>
                  <td>{item.unt_score ? `ЕНТ ${item.unt_score}` : ''}{item.ielts_score ? <small>IELTS {Number(item.ielts_score).toFixed(1)}</small> : ''}{!item.unt_score && !item.ielts_score && '—'}</td>
                  <td>{item.ielts ? `тест ≈ ${Number(item.ielts.band).toFixed(1)}` : ''}{item.career ? <small>профориентация: {item.career.top?.join('+')}</small> : ''}{!item.ielts && !item.career && '—'}</td>
                  <td>{item.contact_consent ? 'да' : 'нет'}{item.applications_count > 0 && <small>заявок: {item.applications_count}</small>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
