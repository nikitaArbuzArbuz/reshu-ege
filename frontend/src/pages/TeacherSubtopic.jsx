import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

const MC_MIN = 2
const MC_MAX = 12

const emptyForm = {
  type: 'MULTIPLE_CHOICE',
  questionText: '',
  correctOptionIndex: 0,
  correctAnswers: [''],
  explanation: '',
  options: ['', '']
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
    api.get(`/subtopics/${id}`).then((r) => setMeta(r.data))
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
    let optionsPayload = null
    if (form.type === 'MULTIPLE_CHOICE') {
      const opts = form.options.map((x) => x.trim())
      if (opts.some((x) => !x)) {
        setErr('Заполните все варианты ответа')
        return
      }
      if (opts.length < MC_MIN || opts.length > MC_MAX) {
        setErr(`Число вариантов: от ${MC_MIN} до ${MC_MAX}`)
        return
      }
      if (form.correctOptionIndex < 0 || form.correctOptionIndex >= opts.length) {
        setErr('Выберите верный вариант из списка')
        return
      }
      optionsPayload = opts
    }
    const body = {
      type: form.type,
      questionText: form.questionText,
      explanation: form.explanation || null,
      correctOptionIndex: form.type === 'MULTIPLE_CHOICE' ? Number(form.correctOptionIndex) : null,
      correctAnswers: form.type === 'TEXT' ? form.correctAnswers.filter((x) => x.trim()) : null,
      options: optionsPayload
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
    const sorted = t.options?.length
      ? [...t.options].sort((a, b) => a.orderIndex - b.orderIndex).map((o) => o.optionText)
      : ['', '']
    const opts = sorted.length >= MC_MIN ? sorted : [...sorted, ...Array(MC_MIN - sorted.length).fill('')]
    setForm({
      type: t.type,
      questionText: t.questionText,
      correctOptionIndex: Math.min(t.correctOptionIndex ?? 0, opts.length - 1),
      correctAnswers: t.correctAnswers?.length ? t.correctAnswers : [''],
      explanation: t.explanation || '',
      options: opts
    })
  }

  const remove = async (taskId) => {
    if (!window.confirm('Удалить задачу?')) return
    await api.delete(`/teacher/tasks/${taskId}`)
    load()
  }

  const setOption = (i, val) => {
    setForm((f) => {
      const opts = [...f.options]
      opts[i] = val
      let idx = f.correctOptionIndex
      if (idx >= opts.length) idx = opts.length - 1
      return { ...f, options: opts, correctOptionIndex: Math.max(0, idx) }
    })
  }

  const addOption = () => {
    setForm((f) => {
      if (f.options.length >= MC_MAX) return f
      return { ...f, options: [...f.options, ''] }
    })
  }

  const removeOption = () => {
    setForm((f) => {
      if (f.options.length <= MC_MIN) return f
      const options = f.options.slice(0, -1)
      let idx = f.correctOptionIndex
      if (idx >= options.length) idx = options.length - 1
      return { ...f, options, correctOptionIndex: idx }
    })
  }

  const title = meta ? `${meta.subjectName} — ${meta.topicName} — ${meta.subtopicName}` : 'Подтема'

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
        <h1 style={{ marginTop: 0 }}>{title}</h1>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Редактирование' : 'Новая задача'}</h2>
          <form onSubmit={save}>
            <div className="field">
              <label>Тип</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="MULTIPLE_CHOICE">Тест: варианты ответа (2–12)</option>
                <option value="TEXT">Короткий ответ (строка)</option>
              </select>
            </div>
            <div className="field">
              <label>Условие</label>
              <textarea value={form.questionText} onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))} required />
            </div>
            {form.type === 'MULTIPLE_CHOICE' && (
              <>
                {form.options.map((opt, i) => (
                  <div key={i} className="field">
                    <label>Вариант {i + 1}</label>
                    <input value={opt} onChange={(e) => setOption(i, e.target.value)} required />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={addOption} disabled={form.options.length >= MC_MAX}>
                    + Вариант
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={removeOption} disabled={form.options.length <= MC_MIN}>
                    − Вариант
                  </button>
                </div>
                <div className="field">
                  <label>Верный вариант</label>
                  <select
                    value={form.correctOptionIndex}
                    onChange={(e) => setForm((f) => ({ ...f, correctOptionIndex: Number(e.target.value) }))}
                  >
                    {form.options.map((_, i) => (
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
