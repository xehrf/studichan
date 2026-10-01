import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Check, ChevronLeft, Compass, RotateCcw, X } from 'lucide-react'
import { CAREER_SCALE, CAREER_STATEMENTS, CAREER_TYPE_INFO, CAREER_TYPES, scoreCareerTest } from './tests/career.js'
import { IELTS_QUESTION_COUNT, IELTS_SECTIONS, findIeltsQuestion, scoreIeltsTest } from './tests/ielts.js'
import { ieltsRequirement, isPlainClick } from './catalog-utils.js'

// Сохранение результата: без входа предлагаем войти, после входа сохраняем сами.
function useResultSaving(type, result, user, onSave) {
  const [status, setStatus] = useState('')
  useEffect(() => {
    if (!result || ['saved', 'saving', 'error'].includes(status)) return
    if (!user) { setStatus('signin'); return }
    setStatus('saving')
    onSave(type, result).then(ok => setStatus(ok ? 'saved' : 'error'))
  }, [type, result, user, onSave, status])
  return status
}

function SaveStatus({ status, t, onAuth }) {
  if (status === 'saved') return <p className="test-save saved"><Check size={16} /> {t('testSave.saved')}</p>
  if (status === 'signin') return <button className="test-save signin" onClick={onAuth}>{t('testSave.signIn')} <ArrowRight size={15} /></button>
  return null
}

const NavLink = ({ href, onNavigate, className, children }) => (
  <a className={className} href={href} onClick={(event) => { if (isPlainClick(event)) { event.preventDefault(); onNavigate(href) } }}>{children}</a>
)

export function CareerTest({ lang, t, user, onAuth, onNavigate, onSaveResult }) {
  const [stage, setStage] = useState('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const saveStatus = useResultSaving('career', result, user, onSaveResult)
  const scale = CAREER_SCALE[lang] || CAREER_SCALE.ru
  const statement = CAREER_STATEMENTS[index]

  useEffect(() => { window.scrollTo(0, 0) }, [stage])

  const answer = (value) => {
    const next = [...answers]
    next[index] = value
    setAnswers(next)
    if (index < CAREER_STATEMENTS.length - 1) {
      setTimeout(() => setIndex(index + 1), 150)
    } else {
      setResult(scoreCareerTest(next))
      setStage('result')
    }
  }

  const restart = () => { setAnswers([]); setIndex(0); setResult(null); setStage('questions') }

  if (stage === 'intro') {
    return (
      <div className="test-page">
        <div className="test-intro">
          <span className="test-icon"><Compass size={28} /></span>
          <p className="catalogue-eyebrow">{t('career.duration')}</p>
          <h2>{t('career.title')}</h2>
          <p>{t('career.intro')}</p>
          <button className="continue-btn" onClick={() => setStage('questions')}>{t('career.start')} <ArrowRight size={17} /></button>
        </div>
      </div>
    )
  }

  if (stage === 'questions') {
    return (
      <div className="test-page">
        <div className="test-card">
          <div className="test-progress-meta">
            <button className="back-question" onClick={() => (index > 0 ? setIndex(index - 1) : setStage('intro'))}><ChevronLeft size={16} /> {t('career.back')}</button>
            <span>{t('career.progress', index + 1, CAREER_STATEMENTS.length)}</span>
          </div>
          <div className="progress-track"><span style={{ width: `${((index + 1) / CAREER_STATEMENTS.length) * 100}%` }} /></div>
          <h2 className="test-statement">{statement[lang] || statement.ru}</h2>
          <div className="scale-options">
            {scale.map((label, option) => (
              <button key={label} className={`scale-option ${answers[index] === option + 1 ? 'selected' : ''}`} onClick={() => answer(option + 1)}>
                <span className="scale-dot" data-value={option + 1} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const info = (type) => CAREER_TYPE_INFO[type][lang] || CAREER_TYPE_INFO[type].ru
  return (
    <div className="test-page">
      <div className="test-result">
        <p className="catalogue-eyebrow">{t('career.title')}</p>
        <h2>{t('career.resultTitle')}</h2>
        <SaveStatus status={saveStatus} t={t} onAuth={onAuth} />
        <h3>{t('career.yourTypes')}</h3>
        <div className="type-cards">
          {result.top.map(type => (
            <div className="type-card" key={type}>
              <span className="type-letter">{type}</span>
              <strong>{info(type).title}</strong>
              <p>{info(type).text}</p>
              <p className="type-jobs"><span>{t('career.jobsLabel')}:</span> {info(type).jobs}</p>
            </div>
          ))}
        </div>
        <h3>{t('career.recommended')}</h3>
        <div className="uni-chips">{result.specialties.map(key => <span className="uni-chip" key={key}>{t(`specialtyNames.${key}`)}</span>)}</div>
        <NavLink className="apply-btn primary test-cta" href={`/?s=${result.specialties.join(',')}`} onNavigate={onNavigate}>{t('career.seeUniversities')} <ArrowRight size={17} /></NavLink>
        <h3>{t('career.allTypes')}</h3>
        <div className="type-bars">
          {CAREER_TYPES.map(type => (
            <div className="type-bar" key={type}>
              <span>{info(type).title}</span>
              <div className="bar-track"><span style={{ width: `${Math.max(result.scores[type], 3)}%` }} /></div>
              <strong>{result.scores[type]}%</strong>
            </div>
          ))}
        </div>
        <p className="test-disclaimer">{t('career.disclaimer')}</p>
        <button className="secondary-btn" onClick={restart}><RotateCcw size={15} /> {t('career.retake')}</button>
      </div>
    </div>
  )
}

export function IeltsTest({ t, user, universities, onAuth, onNavigate, onSaveResult }) {
  const [stage, setStage] = useState('intro')
  const [sectionIndex, setSectionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const saveStatus = useResultSaving('ielts', result, user, onSaveResult)
  const section = IELTS_SECTIONS[sectionIndex]
  const matching = useMemo(() => (result ? universities.filter(item => {
    const required = ieltsRequirement(item)
    return required !== null && required <= result.band
  }).length : 0), [result, universities])

  useEffect(() => { window.scrollTo(0, 0) }, [stage, sectionIndex])

  const finish = () => {
    const unanswered = IELTS_QUESTION_COUNT - Object.keys(answers).length
    if (unanswered > 0 && !window.confirm(t('ielts.unanswered', unanswered))) return
    setResult(scoreIeltsTest(answers))
    setStage('result')
  }
  const restart = () => { setAnswers({}); setSectionIndex(0); setResult(null); setStage('section') }

  if (stage === 'intro') {
    return (
      <div className="test-page">
        <div className="test-intro">
          <span className="test-icon"><BookOpen size={28} /></span>
          <p className="catalogue-eyebrow">{t('ielts.duration')}</p>
          <h2>{t('ielts.title')}</h2>
          <p>{t('ielts.intro')}</p>
          <p className="test-disclaimer">{t('ielts.disclaimer')}</p>
          <button className="continue-btn" onClick={() => setStage('section')}>{t('ielts.start')} <ArrowRight size={17} /></button>
        </div>
      </div>
    )
  }

  if (stage === 'section') {
    const isLast = sectionIndex === IELTS_SECTIONS.length - 1
    let number = IELTS_SECTIONS.slice(0, sectionIndex).reduce((sum, item) => sum + item.questions.length, 0)
    return (
      <div className="test-page wide">
        <div className="test-progress-meta">
          <span className="catalogue-eyebrow">{t('ielts.section', sectionIndex + 1, IELTS_SECTIONS.length)} · {section.title}</span>
          <span>{Object.keys(answers).length} / {IELTS_QUESTION_COUNT}</span>
        </div>
        <div className="progress-track"><span style={{ width: `${(Object.keys(answers).length / IELTS_QUESTION_COUNT) * 100}%` }} /></div>
        <div className={`ielts-layout ${section.passage ? 'with-passage' : ''}`}>
          {section.passage && (
            <article className="ielts-passage" lang="en">
              <h3>{section.passageTitle}</h3>
              {section.passage.map(paragraph => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
            </article>
          )}
          <div className="ielts-questions" lang="en">
            <p className="ielts-instructions">{section.instructions}</p>
            {section.questions.map(question => {
              number += 1
              return (
                <fieldset className="ielts-question" key={question.id}>
                  <legend><span>{number}</span> {question.text}</legend>
                  <div className={`ielts-options ${question.options.length === 3 ? 'inline' : ''}`}>
                    {question.options.map(option => (
                      <label key={option} className={`ielts-option ${answers[question.id] === option ? 'selected' : ''}`}>
                        <input type="radio" name={question.id} value={option} checked={answers[question.id] === option}
                          onChange={() => setAnswers(current => ({ ...current, [question.id]: option }))} />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )
            })}
            <div className="ielts-nav">
              {sectionIndex > 0 && <button className="secondary-btn" onClick={() => setSectionIndex(sectionIndex - 1)}><ChevronLeft size={15} /> {t('ielts.previous')}</button>}
              {isLast
                ? <button className="continue-btn" onClick={finish}>{t('ielts.finish')} <ArrowRight size={17} /></button>
                : <button className="continue-btn" onClick={() => setSectionIndex(sectionIndex + 1)}>{t('ielts.next')} <ArrowRight size={17} /></button>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="test-page">
      <div className="test-result">
        <p className="catalogue-eyebrow">{t('ielts.title')}</p>
        <h2>{t('ielts.resultTitle')}</h2>
        <SaveStatus status={saveStatus} t={t} onAuth={onAuth} />
        <div className="band-panel">
          <div><span>{t('ielts.bandLabel')}</span><strong>≈ {result.band.toFixed(1)}</strong></div>
          <p>{t('ielts.correct', result.correct, result.total)}</p>
        </div>
        <div className="section-scores">
          {IELTS_SECTIONS.map(item => <div key={item.id}><span>{item.title}</span><strong>{result.sections[item.id].correct} / {result.sections[item.id].total}</strong></div>)}
        </div>
        <p className="test-disclaimer">{t('ielts.disclaimer')}</p>
        {matching > 0 && (
          <div className="matching-panel">
            <p>{t('ielts.matching', matching)}</p>
            <NavLink className="apply-btn primary" href={`/?i=${result.band}&sort=ranking`} onNavigate={onNavigate}>{t('ielts.seeUniversities')} <ArrowRight size={17} /></NavLink>
          </div>
        )}
        <h3>{t('ielts.review')}</h3>
        {result.mistakes.length === 0 ? <p>{t('ielts.noMistakes')}</p> : (
          <div className="mistake-list" lang="en">
            {result.mistakes.map(id => {
              const { question } = findIeltsQuestion(id)
              return (
                <div className="mistake-item" key={id}>
                  <p>{question.text}</p>
                  <p className="wrong"><X size={14} /> {t('ielts.yourAnswer')}: {answers[id] || t('ielts.noAnswer')}</p>
                  <p className="right"><Check size={14} /> {t('ielts.correctAnswer')}: {question.answer}</p>
                </div>
              )
            })}
          </div>
        )}
        <button className="secondary-btn" onClick={restart}><RotateCcw size={15} /> {t('ielts.retake')}</button>
      </div>
    </div>
  )
}
