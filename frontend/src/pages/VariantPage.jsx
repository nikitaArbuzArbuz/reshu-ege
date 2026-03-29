import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

const ALLOC_KEY = 'egeVariantAllocations'

export default function VariantPage() {
  const { user, logout } = useAuth()
  const [allocations, setAllocations] = useState(null)
  const [tasks, setTasks] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let raw
    try {
      raw = sessionStorage.getItem(ALLOC_KEY)
    } catch {
      setErr('Не удалось прочитать настройки варианта')
      setLoading(false)
      return
    }
    if (!raw) {
      setErr('Вариант не задан. Вернитесь на главную и укажите число задач по подтемам.')
      setLoading(false)
      return
    }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      setErr('Некорректные данные варианта')
      setLoading(false)
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setErr('Не выбраны подтемы')
      setLoading(false)
      return
    }
    setAllocations(parsed)
  }, [])

  useEffect(() => {
    if (!allocations) return
    setLoading(true)
    setErr('')
    api
      .post('/variant/build', { allocations })
      .then((r) => {
        setTasks(r.data.tasks)
        setAnswers({})
        setResult(null)
      })
      .catch((ex) => {
        setErr(ex.response?.data?.error || 'Не удалось собрать вариант')
      })
      .finally(() => setLoading(false))
  }, [allocations])

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
              {t.subjectName} → {t.topicName} → {t.subtopicName}
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
