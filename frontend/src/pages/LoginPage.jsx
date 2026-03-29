import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [portal, setPortal] = useState('STUDENT')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await login(email, password, portal)
      if (portal === 'TEACHER') {
        nav('/teacher', { replace: true })
      } else {
        nav('/', { replace: true })
      }
    } catch (ex) {
      const msg = ex.response?.data?.error || 'Не удалось войти'
      setErr(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/login">
          ЕГЭ — тренировка
        </Link>
        <div className="topbar-actions">
          <Link className="btn btn-ghost" to="/register">
            Регистрация
          </Link>
        </div>
      </header>
      <div className="container">
        <div className="card" style={{ maxWidth: 440, margin: '2rem auto' }}>
          <h1 style={{ marginTop: 0 }}>Вход</h1>
          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="username" />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="current-password" />
            </div>
            <div className="field">
              <label>Кабинет</label>
              <select value={portal} onChange={(e) => setPortal(e.target.value)}>
                <option value="STUDENT">Ученик — варианты и задачи</option>
                <option value="TEACHER">Учитель — редактирование банка</option>
              </select>
            </div>
            {err && <p className="error">{err}</p>}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Вход…' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
