import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

export default function TeacherHome() {
  const { user, logout, isTeacher, isAdmin } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [details, setDetails] = useState({})
  const [openSubject, setOpenSubject] = useState(() => new Set())
  const [err, setErr] = useState('')

  const loadSubject = useCallback((subjectId) => {
    if (details[subjectId]) return
    api.get(`/subjects/${subjectId}`).then((r) => {
      setDetails((d) => ({ ...d, [subjectId]: r.data }))
    })
  }, [details])

  useEffect(() => {
    api
      .get('/subjects')
      .then((r) => setSubjects(r.data))
      .catch(() => setErr('Не удалось загрузить предметы'))
  }, [])

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

  const onSubjectCreated = (row) => {
    setSubjects((prev) => [...prev, row].sort((a, b) => a.sortOrder - b.sortOrder))
  }

  const onTopicCreated = (subjectId, row) => {
    const topicDetail = {
      id: row.id,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      name: row.name,
      slug: row.slug,
      sortOrder: row.sortOrder,
      subtopics: []
    }
    setDetails((d) => {
      const cur = d[subjectId]
      if (!cur) return d
      const topics = [...cur.topics, topicDetail].sort((a, b) => a.sortOrder - b.sortOrder)
      return { ...d, [subjectId]: { ...cur, topics } }
    })
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, topicCount: s.topicCount + 1 } : s))
    )
  }

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

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {subjects.map((s) => (
            <div key={s.id} className="subject-block card">
              <button type="button" className="subject-block-head" onClick={() => toggleSubject(s.id)} aria-expanded={openSubject.has(s.id)}>
                <span className="subject-chevron">{openSubject.has(s.id) ? '▼' : '▶'}</span>
                <span className="subject-title">{s.name}</span>
              </button>
              {openSubject.has(s.id) && (
                <div className="subject-body">
                  {!details[s.id] && <p className="muted">Загрузка…</p>}
                  {details[s.id]?.topics?.map((topic) => (
                    <TopicHover
                      key={topic.id}
                      topic={topic}
                      onSubtopicAdded={(fullTopic) => {
                        setDetails((d) => {
                          const cur = d[s.id]
                          if (!cur) return d
                          const topics = cur.topics.map((t) => (t.id === fullTopic.id ? fullTopic : t))
                          return { ...d, [s.id]: { ...cur, topics } }
                        })
                      }}
                    />
                  ))}
                  {details[s.id] && <AddTopic subjectId={s.id} onCreated={(row) => onTopicCreated(s.id, row)} />}
                </div>
              )}
            </div>
          ))}
        </div>

        <CreateSubjectForm onCreated={onSubjectCreated} />
      </div>
    </>
  )
}

function TopicHover({ topic, onSubtopicAdded }) {
  return (
    <div className="topic-hover" style={{ marginBottom: '0.75rem' }}>
      <div className="topic-hover-trigger">{topic.name}</div>
      <div className="topic-hover-menu">
        {topic.subtopics?.map((sub) => (
          <Link key={sub.id} to={`/teacher/subtopic/${sub.id}`}>
            {sub.name} <span className="muted">({sub.taskCount})</span>
          </Link>
        ))}
        <AddSubtopic topicId={topic.id} onAdded={onSubtopicAdded} />
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
      await api.post(`/teacher/topics/${topicId}/subtopics`, { name: name.trim() })
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

function AddTopic({ subjectId, onCreated }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [localErr, setLocalErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLocalErr('')
    setBusy(true)
    try {
      const { data } = await api.post(`/teacher/subjects/${subjectId}/topics`, {
        name: name.trim(),
        slug: slug.trim() || undefined
      })
      onCreated(data)
      setName('')
      setSlug('')
    } catch (ex) {
      setLocalErr(ex.response?.data?.error || 'Не удалось создать тему')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
      <div className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        Новая тема в этом предмете
      </div>
      <div className="field" style={{ marginBottom: '0.5rem' }}>
        <label>Название</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field" style={{ marginBottom: '0.5rem' }}>
        <label>Slug (необязательно)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>
      {localErr && <p className="error">{localErr}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        Создать тему
      </button>
    </form>
  )
}

function CreateSubjectForm({ onCreated }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const { data } = await api.post('/teacher/subjects', { name: name.trim(), slug: slug.trim() || undefined })
      onCreated(data)
      setName('')
      setSlug('')
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Не удалось создать предмет')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h2 style={{ marginTop: 0 }}>Новый предмет</h2>
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
            Создать предмет
          </button>
        </div>
      </form>
    </div>
  )
}
