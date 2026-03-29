import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

export default function StudentHome() {
  const nav = useNavigate()
  const { user, logout, isTeacher, isAdmin } = useAuth()
  const [topics, setTopics] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [count, setCount] = useState(5)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/topics')
      .then((r) => setTopics(r.data))
      .catch(() => setErr('Не удалось загрузить темы'))
      .finally(() => setLoading(false))
  }, [])

  const toggleSub = (id) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const start = () => {
    if (selected.size === 0) {
      setErr('Выберите хотя бы одну подтему')
      return
    }
    const ids = [...selected]
    const q = new URLSearchParams()
    q.set('subtopicIds', ids.join(','))
    q.set('taskCount', String(count))
    nav(`/variant?${q.toString()}`)
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
        {loading && <p className="muted">Загрузка тем…</p>}
        {err && !loading && <p className="error">{err}</p>}
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Число заданий в варианте</label>
          <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </div>
        {topics.map((t) => (
          <TopicCard key={t.id} topicId={t.id} name={t.name} selected={selected} onToggle={toggleSub} />
        ))}
        <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={start}>
          Начать решение
        </button>
      </div>
    </>
  )
}

function TopicCard({ topicId, name, selected, onToggle }) {
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    api.get(`/topics/${topicId}`).then((r) => setDetail(r.data))
  }, [topicId])

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>{name}</h2>
      {!detail && <p className="muted">Загрузка подтем…</p>}
      {detail?.subtopics?.map((s) => (
        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <input type="checkbox" checked={selected.has(s.id)} onChange={() => onToggle(s.id)} />
          <span>
            {s.name} <span className="muted">({s.taskCount} задач)</span>
          </span>
        </label>
      ))}
    </div>
  )
}
