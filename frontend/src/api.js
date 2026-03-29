import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export function setToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common.Authorization
    localStorage.removeItem('token')
  }
}

export function loadStoredToken() {
  const t = localStorage.getItem('token')
  if (t) {
    api.defaults.headers.common.Authorization = `Bearer ${t}`
  }
  return t
}

export default api
