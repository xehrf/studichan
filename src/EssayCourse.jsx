import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock, Lightbulb, ListChecks, PenLine, RotateCcw, TriangleAlert } from 'lucide-react'
import { ESSAY_LESSONS, ESSAY_LESSON_COUNT, ESSAY_MODULES, countText, essayLessonText, essayModuleTitle } from './course/essay.js'
import { isPlainClick, storage } from './catalog-utils.js'

// Прогресс и черновики упражнений живут только в браузере: курс открыт без
// входа, а тексты эссе — личные, на сервер их не отправляем.
const DONE_KEY = 'studichan:essay:done'
const draftKey = (id) => `studichan:essay:draft:${id}`

export const essayHref = (id) => (id ? `/essay/${id}` : '/essay')

const Link = ({ href, onNavigate, className, children, ...rest }) => (
  <a className={className} href={href} onClick={(event) => { if (isPlainClick(event)) { event.preventDefault(); onNavigate(href) } }} {...rest}>{children}</a>
)

function useEssayProgress() {
  const [done, setDone] = useState(() => {
    const saved = storage.get(DONE_KEY, [])
    return Array.isArray(saved) ? saved.filter(id => ESSAY_LESSONS.some(lesson => lesson.id === id)) : []
  })
  const update = (next) => { setDone(next); storage.set(DONE_KEY, next) }
  const toggle = (id) => update(done.includes(id) ? done.filter(value => value !== id) : [...done, id])
  const reset = () => {
    ESSAY_LESSONS.forEach(lesson => storage.set(draftKey(lesson.id), ''))
    update([])
  }
  return { done, toggle, reset }
}

export default function EssayCourse({ lessonId, lang, t, onNavigate }) {
  const progress = useEssayProgress()
  const lesson = ESSAY_LESSONS.find(item => item.id === lessonId)
  return lesson
    ? <EssayLesson key={lesson.id} lesson={lesson} lang={lang} t={t} progress={progress} onNavigate={onNavigate} />
    : <EssayOverview lang={lang} t={t} progress={progress} onNavigate={onNavigate} />
}

function EssayOverview({ lang, t, progress, onNavigate }) {
  const { done, reset } = progress
  const nextLesson = ESSAY_LESSONS.find(lesson => !done.includes(lesson.id))
  const confirmReset = () => { if (window.confirm(t('essay.resetConfirm'))) reset() }

  return (
    <div className="essay-page">
      <header className="essay-hero">
        <p className="catalogue-eyebrow">{t('essay.eyebrow')}</p>
        <h2>{t('essay.title')}</h2>
        <p className="essay-intro">{t('essay.intro')}</p>
        <div className="essay-stats">
          <span><strong>{ESSAY_LESSON_COUNT}</strong>{t('essay.stats.lessons')}</span>
          <span><strong>{ESSAY_LESSON_COUNT}</strong>{t('essay.stats.exercises')}</span>
          <span><strong>{ESSAY_LESSON_COUNT}</strong>{t('essay.stats.reviews')}</span>
        </div>
        <div className="essay-progress">
          <div className="essay-progress-meta">
            <span>{t('essay.progress', done.length, ESSAY_LESSON_COUNT)}</span>
            {done.length > 0 && <button className="essay-reset" onClick={confirmReset}><RotateCcw size={13} /> {t('essay.reset')}</button>}
          </div>
          <div className="progress-track"><span style={{ width: `${(done.length / ESSAY_LESSON_COUNT) * 100}%` }} /></div>
        </div>
        {nextLesson
          ? <Link className="continue-btn" href={essayHref(nextLesson.id)} onNavigate={onNavigate}>{done.length ? t('essay.continue', nextLesson.id) : t('essay.start')} <ArrowRight size={17} /></Link>
          : <EssayFinish t={t} onNavigate={onNavigate} />}
      </header>

      <div className="essay-modules">
        {ESSAY_MODULES.map((module, index) => (
          <section className="essay-module" key={module.id}>
            <h3><span>{String(index + 1).padStart(2, '0')}</span>{essayModuleTitle(module.id, lang)}</h3>
            <div className="essay-lesson-grid">
              {ESSAY_LESSONS.filter(lesson => lesson.module === module.id).map(lesson => {
                const text = essayLessonText(lesson, lang)
                const isDone = done.includes(lesson.id)
                return (
                  <Link className={`essay-lesson-card ${isDone ? 'done' : ''}`} key={lesson.id} href={essayHref(lesson.id)} onNavigate={onNavigate}>
                    <span className="essay-lesson-meta">
                      <span>{t('essay.lesson', lesson.id)}</span>
                      {isDone ? <span className="essay-done-flag"><Check size={13} /> {t('essay.done')}</span> : <span><Clock size={12} /> {t('essay.minutes', lesson.minutes)}</span>}
                    </span>
                    <strong>{text.title}</strong>
                    <small>{text.summary}</small>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function EssayFinish({ t, onNavigate }) {
  return (
    <div className="essay-finish">
      <strong>{t('essay.finishTitle')}</strong>
      <p>{t('essay.finishText')}</p>
      <Link className="continue-btn" href="/" onNavigate={onNavigate}>{t('essay.finishCta')} <ArrowRight size={17} /></Link>
    </div>
  )
}

function EssayLesson({ lesson, lang, t, progress, onNavigate }) {
  const text = essayLessonText(lesson, lang)
  const { done, toggle } = progress
  const isDone = done.includes(lesson.id)
  const index = ESSAY_LESSONS.indexOf(lesson)
  const prev = ESSAY_LESSONS[index - 1]
  const next = ESSAY_LESSONS[index + 1]
  const [draft, setDraft] = useState(() => storage.get(draftKey(lesson.id), ''))
  const limit = lesson.limit
  const count = countText(draft, limit)
  const max = limit?.chars || limit?.words
  const overLimit = Boolean(max && count > max)

  useEffect(() => { storage.set(draftKey(lesson.id), draft) }, [lesson.id, draft])

  const markDone = () => {
    toggle(lesson.id)
    if (!isDone && next) onNavigate(essayHref(next.id))
  }

  return (
    <div className="essay-page">
      <nav className="detail-crumbs">
        <Link className="back-btn" href={essayHref()} onNavigate={onNavigate}>{t('essayLink')}</Link>
        <ChevronRight size={13} />
        <span className="current">{t('essay.lesson', lesson.id)}</span>
      </nav>

      <div className="essay-layout">
        <article className="essay-main">
          <header className="essay-lesson-head">
            <p className="catalogue-eyebrow">{essayModuleTitle(lesson.module, lang)} · {t('essay.lesson', lesson.id)} · {t('essay.minutes', lesson.minutes)}</p>
            <h2>{text.title}</h2>
            <p className="essay-intro">{text.summary}</p>
          </header>

          <section className="essay-block">
            <h3><Lightbulb size={20} /> {t('essay.keyPoints')}</h3>
            <ol className="essay-points">
              {text.points.map(point => <li key={point}>{point}</li>)}
            </ol>
          </section>

          <section className="essay-block">
            <h3><TriangleAlert size={20} /> {t('essay.mistakes')}</h3>
            <ul className="essay-mistakes">
              {text.mistakes.map(item => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section className="essay-block essay-exercise">
            <h3><PenLine size={20} /> {t('essay.exercise')}: {text.exercise.title}</h3>
            <ol className="essay-steps">
              {text.exercise.steps.map(step => <li key={step}>{step}</li>)}
            </ol>
            <label className="essay-draft">
              <span>{t('essay.draftLabel')}</span>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={text.exercise.placeholder} rows={10} spellCheck />
            </label>
            <div className="essay-draft-meta">
              <span>{t('essay.draftSaved')}</span>
              <span className={overLimit ? 'over' : ''}>{limit?.chars ? t('essay.chars', count, max) : t('essay.words', count, max)}</span>
            </div>
            {overLimit && <p className="essay-over-limit">{t('essay.overLimit')}</p>}
          </section>

          <section className="essay-block">
            <h3><ListChecks size={20} /> {t('essay.review')}</h3>
            <div className="essay-compare">
              <div className="essay-version before"><span>{t('essay.before')}</span><p lang="en">{lesson.review.before}</p></div>
              <div className="essay-version after"><span>{t('essay.after')}</span><p lang="en">{lesson.review.after}</p></div>
            </div>
            <h4>{t('essay.whyBetter')}</h4>
            <ul className="essay-notes">
              {text.reviewNotes.map(note => <li key={note}><Check size={15} /> {note}</li>)}
            </ul>
            <p className="muted-text">{t('essay.examplesNote')}</p>
          </section>

          <footer className="essay-lesson-footer">
            <button className={`essay-done-btn ${isDone ? 'done' : ''}`} onClick={markDone} aria-pressed={isDone}>
              <Check size={17} /> {isDone ? t('essay.markedDone') : t('essay.markDone')}
            </button>
            {!next && isDone && <EssayFinish t={t} onNavigate={onNavigate} />}
            <div className="essay-pager">
              {prev
                ? <Link className="secondary-btn" href={essayHref(prev.id)} onNavigate={onNavigate}><ArrowLeft size={15} /> {t('essay.prev')}</Link>
                : <Link className="secondary-btn" href={essayHref()} onNavigate={onNavigate}><ArrowLeft size={15} /> {t('essay.toOverview')}</Link>}
              {next && <Link className="secondary-btn" href={essayHref(next.id)} onNavigate={onNavigate}>{t('essay.next')} <ArrowRight size={15} /></Link>}
            </div>
          </footer>
        </article>

        <aside className="essay-aside">
          <p className="filter-label">{t('essay.contents')}</p>
          <ol className="essay-toc">
            {ESSAY_LESSONS.map(item => (
              <li key={item.id}>
                <Link
                  className={`${item.id === lesson.id ? 'active' : ''} ${done.includes(item.id) ? 'done' : ''}`}
                  href={essayHref(item.id)} onNavigate={onNavigate}
                  aria-current={item.id === lesson.id ? 'page' : undefined}
                >
                  <span className="essay-toc-mark">{done.includes(item.id) ? <Check size={12} /> : item.id}</span>
                  <span>{essayLessonText(item, lang).title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  )
}
