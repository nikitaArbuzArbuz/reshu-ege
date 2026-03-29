import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

const ALLOC_KEY = 'egeVariantAllocations'

export default function StudentHome() {
  const nav = useNavigate()
  const { user, logout, isTeacher, isAdmin } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [details, setDetails] = useState({})
  const [openSubject, setOpenSubject] = useState(() => new Set())
  const [counts, setCounts] = useState({})
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/subjects')
      .then((r) => setSubjects(r.data))
      .catch(() => setErr('Не удалось загрузить предметы'))
      .finally(() => setLoading(false))
  }, [])

  const loadSubject = useCallback((subjectId) => {
    if (details[subjectId]) return
    api.get(`/subjects/${subjectId}`).then((r) => {
      setDetails((d) => ({ ...d, [subjectId]: r.data }))
    })
  }, [details])

  const toggleSubject = (id) => {
    setOpenSubject((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else {
        n.add(id)
        loadSubject(id)
      }
      return n
    })
  }

  const setCount = (subtopicId, value) => {
    const v = Math.min(50, Math.max(0, Number(value) || 0))
    setCounts((c) => ({ ...c, [subtopicId]: v }))
  }

  const bump = (subtopicId, delta) => {
    const cur = counts[subtopicId] ?? 0
    setCount(subtopicId, cur + delta)
  }

  const start = () => {
    const allocations = Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([subtopicId, count]) => ({ subtopicId: Number(subtopicId), count }))
    if (allocations.length === 0) {
      setErr('Укажите число задач хотя бы по одной подтеме')
      return
    }
    setErr('')
    try {
      sessionStorage.setItem(ALLOC_KEY, JSON.stringify(allocations))
    } catch {
      setErr('Не удалось сохранить настройки варианта')
      return
    }
    nav('/variant')
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/">
          ЕГЭ — тренировка
        </Link>
        <div className="topbar-actions">
          <span className="muted">
            {user.displayName} <span className="badge">{user.role}</span>
          </span>
          {isTeacher && (
            <Link className="btn btn-ghost" to="/teacher">
              Кабинет учителя
            </Link>
          )}
          {isAdmin && (
            <Link className="btn btn-ghost" to="/admin">
              Админка
            </Link>
          )}
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      <div className="container">
        <h1 style={{ marginTop: 0 }}>Собрать вариант</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Выберите предмет, затем укажите, сколько заданий взять из каждой подтемы.
        </p>
        {loading && <p className="muted">Загрузка…</p>}
        {err && !loading && <p className="error">{err}</p>}

        {subjects.map((s) => (
          <div key={s.id} className="subject-block card" style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              className="subject-block-head"
              onClick={() => toggleSubject(s.id)}
              aria-expanded={openSubject.has(s.id)}
            >
              <span className="subject-chevron">{openSubject.has(s.id) ? '▼' : '▶'}</span>
              <span className="subject-title">{s.name}</span>
              <span className="muted" style={{ fontWeight: 400 }}>
                ({s.topicCount} {s.topicCount === 1 ? 'тема' : 'тем'})
              </span>
            </button>
            {openSubject.has(s.id) && (
              <div className="subject-body">
                {!details[s.id] && <p className="muted">Загрузка тем…</p>}
                {details[s.id]?.topics?.map((topic, ti) => (
                  <div key={topic.id} className="topic-in-subject">
                    <h3 className="topic-in-subject-title">
                      {ti + 1}. {topic.name}
                    </h3>
                    <table className="alloc-table">
                      <thead>
                        <tr>
                          <th className="col-qty">Количество</th>
                          <th>Подтема</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topic.subtopics?.map((sub) => (
                          <tr key={sub.id}>
                            <td className="col-qty">
                              <div className="qty-stepper">
                                <button type="button" className="btn btn-ghost qty-btn" onClick={() => bump(sub.id, -1)} aria-label="Меньше">
                                  −
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={counts[sub.id] ?? 0}
                                  onChange={(e) => setCount(sub.id, e.target.value)}
                                  className="qty-input"
                                />
                                <button type="button" className="btn btn-ghost qty-btn" onClick={() => bump(sub.id, 1)} aria-label="Больше">
                                  +
                                </button>
                              </div>
                            </td>
                            <td>
                              {sub.name}
                              <span className="muted"> · {sub.taskCount} шт.</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={start}>
          Начать решение
        </button>
      </div>
    </>
  )
}
