import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

export default function VariantPage() {
  const { user, logout } = useAuth()
  const [params] = useSearchParams()
  const subtopicIds = useMemo(() => {
    const raw = params.get('subtopicIds') || ''
    return raw
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0)
  }, [params])
  const taskCount = Math.min(50, Math.max(1, Number(params.get('taskCount')) || 5))

  const [tasks, setTasks] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (subtopicIds.length === 0) {
      setErr('Не выбраны подтемы')
      setLoading(false)
      return
    }
    api
      .post('/variant/build', { subtopicIds, taskCount })
      .then((r) => {
        setTasks(r.data.tasks)
        setAnswers({})
        setResult(null)
      })
      .catch((ex) => {
        setErr(ex.response?.data?.error || 'Не удалось собрать вариант')
      })
      .finally(() => setLoading(false))
  }, [subtopicIds, taskCount])

  const setMc = (taskId, idx) => {
    setAnswers((a) => ({ ...a, [taskId]: { selectedIndex: idx } }))
  }

  const setText = (taskId, text) => {
    setAnswers((a) => ({ ...a, [taskId]: { textAnswer: text } }))
  }

  const submit = async () => {
    setErr('')
    const list = tasks.map((t) => {
      const a = answers[t.id] || {}
      return {
        taskId: t.id,
        selectedIndex: t.type === 'MULTIPLE_CHOICE' ? a.selectedIndex ?? null : null,
        textAnswer: t.type === 'TEXT' ? a.textAnswer ?? '' : null
      }
    })
    try {
      const { data } = await api.post('/variant/submit', { answers: list })
      setResult(data)
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Ошибка проверки')
    }
  }

  const byId = result ? Object.fromEntries(result.results.map((r) => [r.taskId, r])) : {}

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/">
          ЕГЭ — тренировка
        </Link>
        <div className="topbar-actions">
          <span className="muted">{user.displayName}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      <div className="container">
        <p>
          <Link to="/">← К выбору тем</Link>
        </p>
        {loading && <p className="muted">Собираем вариант…</p>}
        {err && <p className="error">{err}</p>}
        {!loading && tasks.length === 0 && !err && <p className="muted">Нет заданий</p>}
        {tasks.map((t, i) => (
          <div key={t.id} className="task-block">
            <div className="task-q">
              <span className="muted" style={{ marginRight: '0.35rem' }}>
                {i + 1}.
              </span>
              {t.questionText}
            </div>
            <div className="muted" style={{ marginBottom: '0.5rem' }}>
              {t.topicName} → {t.subtopicName}
            </div>
            {t.type === 'MULTIPLE_CHOICE' && (
              <div className="options">
                {t.options.map((o) => (
                  <label key={o.orderIndex} className="option-row">
                    <input
                      type="radio"
                      name={`t-${t.id}`}
                      checked={(answers[t.id]?.selectedIndex ?? null) === o.orderIndex}
                      onChange={() => setMc(t.id, o.orderIndex)}
                    />
                    <span>{o.optionText}</span>
                  </label>
                ))}
              </div>
            )}
            {t.type === 'TEXT' && (
              <input
                style={{ width: '100%', maxWidth: 420 }}
                placeholder="Ваш ответ"
                value={answers[t.id]?.textAnswer ?? ''}
                onChange={(e) => setText(t.id, e.target.value)}
              />
            )}
            {result && byId[t.id] && (
              <p style={{ marginTop: '0.75rem' }}>
                <span className={`badge ${byId[t.id].correct ? 'ok' : 'bad'}`}>{byId[t.id].correct ? 'Верно' : 'Неверно'}</span>
                {byId[t.id].explanation && <span className="muted" style={{ marginLeft: '0.5rem' }}>{byId[t.id].explanation}</span>}
              </p>
            )}
          </div>
        ))}
        {tasks.length > 0 && !result && (
          <button type="button" className="btn btn-primary" onClick={submit}>
            Проверить вариант
          </button>
        )}
        {result && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h2 style={{ marginTop: 0 }}>Результат</h2>
            <p>
              Правильно: <strong>{result.correctCount}</strong> из <strong>{result.total}</strong>
            </p>
            <Link className="btn btn-ghost" to="/">
              Новый вариант
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
