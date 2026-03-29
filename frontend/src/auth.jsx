import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { loadStoredToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    const t = loadStoredToken()
    if (!t) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshMe()
  }, [refreshMe])

  const login = async (email, password, portal) => {
    const { data } = await api.post('/auth/login', { email, password, portal })
    setToken(data.token)
    setUser({
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      role: data.role
    })
    return data
  }

  const register = async (email, password, displayName) => {
    const { data } = await api.post('/auth/register', { email, password, displayName })
    setToken(data.token)
    setUser({
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      role: data.role
    })
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshMe,
      isAdmin: user?.role === 'ADMIN',
      isTeacher: user?.role === 'TEACHER' || user?.role === 'ADMIN'
    }),
    [user, loading, refreshMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
