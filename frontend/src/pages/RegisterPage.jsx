import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function RegisterPage() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await register(email, password, displayName)
      nav('/', { replace: true })
    } catch (ex) {
      const msg = ex.response?.data?.error || 'Ошибка регистрации'
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
          <Link className="btn btn-ghost" to="/login">
            Уже есть аккаунт
          </Link>
        </div>
      </header>
      <div className="container">
        <div className="card" style={{ maxWidth: 440, margin: '2rem auto' }}>
          <h1 style={{ marginTop: 0 }}>Регистрация</h1>
          <form onSubmit={submit}>
            <div className="field">
              <label>Имя</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={120} />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} autoComplete="new-password" />
            </div>
            {err && <p className="error">{err}</p>}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Создание…' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
