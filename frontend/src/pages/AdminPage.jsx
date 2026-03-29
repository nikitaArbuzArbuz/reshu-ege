import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

export default function AdminPage() {
  const { user, logout, isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => {
    api
      .get('/admin/users')
      .then((r) => setUsers(r.data))
      .catch(() => setErr('Нет доступа или ошибка'))
  }

  useEffect(() => {
    load()
  }, [])

  const grant = async (userId) => {
    setMsg('')
    setErr('')
    try {
      await api.post(`/admin/users/${userId}/grant-teacher`)
      setMsg('Готово.')
      load()
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Ошибка')
    }
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/admin">
          Администрирование
        </Link>
        <div className="topbar-actions">
          <span className="muted">{user.displayName}</span>
          <Link className="btn btn-ghost" to="/teacher">
            Учитель
          </Link>
          <Link className="btn btn-ghost" to="/">
            Ученик
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      <div className="container">
        <h1 style={{ marginTop: 0 }}>Пользователи</h1>
        {err && <p className="error">{err}</p>}
        {msg && <p style={{ color: 'var(--success)' }}>{msg}</p>}
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.5rem' }}>Email</th>
                <th>Имя</th>
                <th>Роль</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem' }}>{u.email}</td>
                  <td>{u.displayName}</td>
                  <td>
                    <span className="badge">{u.role}</span>
                  </td>
                  <td>
                    {u.role === 'STUDENT' && (
                      <button type="button" className="btn btn-primary" onClick={() => grant(u.id)}>
                        Выдать учителя
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
