import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

export default function TeacherHome() {
  const { user, logout, isTeacher, isAdmin } = useAuth()
  const [topics, setTopics] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    api
      .get('/topics')
      .then((r) => setTopics(r.data))
      .catch(() => setErr('Не удалось загрузить темы'))
  }, [])

  if (!isTeacher) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/teacher">
          Кабинет учителя
        </Link>
        <div className="topbar-actions">
          <span className="muted">
            {user.displayName} <span className="badge">{user.role}</span>
          </span>
          {isAdmin && (
            <Link className="btn btn-ghost" to="/admin">
              Админка
            </Link>
          )}
          <Link className="btn btn-ghost" to="/">
            К ученику
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      <div className="container">
        <h1 style={{ marginTop: 0 }}>Предметы и подтемы</h1>
        {err && <p className="error">{err}</p>}
        <div className="grid-2">
          {topics.map((t) => (
            <TopicHover key={t.id} topicId={t.id} name={t.name} />
          ))}
        </div>
        <CreateTopicForm onCreated={(row) => setTopics((prev) => [...prev, row].sort((a, b) => a.sortOrder - b.sortOrder))} />
      </div>
    </>
  )
}

function TopicHover({ topicId, name }) {
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    api.get(`/topics/${topicId}`).then((r) => setDetail(r.data))
  }, [topicId])

  return (
    <div className="topic-hover">
      <div className="topic-hover-trigger">{name}</div>
      <div className="topic-hover-menu">
        {!detail && <div className="muted" style={{ padding: '0.5rem' }}>Загрузка…</div>}
        {detail?.subtopics?.map((s) => (
          <Link key={s.id} to={`/teacher/subtopic/${s.id}`}>
            {s.name} <span className="muted">({s.taskCount})</span>
          </Link>
        ))}
        {detail && <AddSubtopic topicId={topicId} onAdded={(d) => setDetail(d)} />}
      </div>
    </div>
  )
}

function AddSubtopic({ topicId, onAdded }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const { data } = await api.post(`/teacher/topics/${topicId}/subtopics`, { name: name.trim() })
      setName('')
      const full = await api.get(`/topics/${topicId}`)
      onAdded(full.data)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={add} style={{ padding: '0.5rem', borderTop: '1px solid var(--border)' }}>
      <div className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>
        Новая подтема
      </div>
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          +
        </button>
      </div>
    </form>
  )
}

function CreateTopicForm({ onCreated }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const { data } = await api.post('/teacher/topics', { name: name.trim(), slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-') })
      onCreated(data)
      setName('')
      setSlug('')
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Не удалось создать тему')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h2 style={{ marginTop: 0 }}>Новая тема</h2>
      <form onSubmit={submit} className="grid-2">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Название</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        {err && <p className="error">{err}</p>}
        <div style={{ gridColumn: '1 / -1' }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Создать тему
          </button>
        </div>
      </form>
    </div>
  )
}
