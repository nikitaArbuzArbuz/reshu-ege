import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

const emptyForm = {
  type: 'MULTIPLE_CHOICE',
  questionText: '',
  correctOptionIndex: 0,
  correctAnswers: [''],
  explanation: '',
  options: ['', '', '', '']
}

export default function TeacherSubtopic() {
  const { id } = useParams()
  const { user, logout, isTeacher, isAdmin } = useAuth()
  const [tasks, setTasks] = useState([])
  const [meta, setMeta] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [err, setErr] = useState('')

  const load = () => {
    api.get(`/teacher/subtopics/${id}/tasks`).then((r) => setTasks(r.data))
    api.get('/topics').then((r) => {
      const topics = r.data
      Promise.all(topics.map((t) => api.get(`/topics/${t.id}`))).then((res) => {
        for (const x of res) {
          const sub = x.data.subtopics.find((s) => String(s.id) === String(id))
          if (sub) {
            setMeta({ topicName: x.data.name, subtopicName: sub.name })
            break
          }
        }
      })
    })
  }

  useEffect(() => {
    load()
  }, [id])

  if (!isTeacher) {
    return <Navigate to="/" replace />
  }

  const save = async (e) => {
    e.preventDefault()
    setErr('')
    const body = {
      type: form.type,
      questionText: form.questionText,
      explanation: form.explanation || null,
      correctOptionIndex: form.type === 'MULTIPLE_CHOICE' ? Number(form.correctOptionIndex) : null,
      correctAnswers: form.type === 'TEXT' ? form.correctAnswers.filter((x) => x.trim()) : null,
      options: form.type === 'MULTIPLE_CHOICE' ? form.options : null
    }
    try {
      if (editingId) {
        await api.put(`/teacher/tasks/${editingId}`, body)
      } else {
        await api.post(`/teacher/subtopics/${id}/tasks`, body)
      }
      setForm(emptyForm)
      setEditingId(null)
      load()
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Ошибка сохранения')
    }
  }

  const edit = (t) => {
    setEditingId(t.id)
    setForm({
      type: t.type,
      questionText: t.questionText,
      correctOptionIndex: t.correctOptionIndex ?? 0,
      correctAnswers: t.correctAnswers?.length ? t.correctAnswers : [''],
      explanation: t.explanation || '',
      options: t.options?.length === 4 ? t.options.map((o) => o.optionText) : ['', '', '', '']
    })
  }

  const remove = async (taskId) => {
    if (!window.confirm('Удалить задачу?')) return
    await api.delete(`/teacher/tasks/${taskId}`)
    load()
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/teacher">
          ← К предметам
        </Link>
        <div className="topbar-actions">
          <span className="muted">{user.displayName}</span>
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
        <h1 style={{ marginTop: 0 }}>{meta ? `${meta.topicName} — ${meta.subtopicName}` : 'Подтема'}</h1>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Редактирование' : 'Новая задача'}</h2>
          <form onSubmit={save}>
            <div className="field">
              <label>Тип</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="MULTIPLE_CHOICE">Тест: 4 варианта</option>
                <option value="TEXT">Короткий ответ (строка)</option>
              </select>
            </div>
            <div className="field">
              <label>Условие</label>
              <textarea value={form.questionText} onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))} required />
            </div>
            {form.type === 'MULTIPLE_CHOICE' && (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="field">
                    <label>Вариант {i + 1}</label>
                    <input value={form.options[i]} onChange={(e) => {
                      const opts = [...form.options]
                      opts[i] = e.target.value
                      setForm((f) => ({ ...f, options: opts }))
                    }} required />
                  </div>
                ))}
                <div className="field">
                  <label>Верный вариант (номер 1–4)</label>
                  <select
                    value={form.correctOptionIndex}
                    onChange={(e) => setForm((f) => ({ ...f, correctOptionIndex: Number(e.target.value) }))}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <option key={i} value={i}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {form.type === 'TEXT' && (
              <div className="field">
                <label>Допустимые ответы</label>
                {form.correctAnswers.map((a, i) => (
                  <input
                    key={i}
                    style={{ marginBottom: '0.35rem' }}
                    value={a}
                    onChange={(e) => {
                      const c = [...form.correctAnswers]
                      c[i] = e.target.value
                      setForm((f) => ({ ...f, correctAnswers: c }))
                    }}
                    placeholder="Верный ответ"
                  />
                ))}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: '0.35rem' }}
                  onClick={() => setForm((f) => ({ ...f, correctAnswers: [...f.correctAnswers, ''] }))}
                >
                  + Добавить альтернативу
                </button>
              </div>
            )}
            <div className="field">
              <label>Комментарий</label>
              <input value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} />
            </div>
            {err && <p className="error">{err}</p>}
            <button className="btn btn-primary" type="submit">
              {editingId ? 'Сохранить' : 'Добавить'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginLeft: '0.5rem' }}
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Отмена
              </button>
            )}
          </form>
        </div>

        <h2>Задачи в подтеме</h2>
        {tasks.map((t) => (
          <div key={t.id} className="task-block">
            <div className="task-q">{t.questionText}</div>
            <span className="badge">{t.type}</span>
            <div style={{ marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => edit(t)}>
                Изменить
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => remove(t.id)}>
                Удалить
              </button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="muted">Пока нет задач</p>}
      </div>
    </>
  )
}
