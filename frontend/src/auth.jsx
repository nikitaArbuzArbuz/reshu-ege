import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
    } catch {
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
    setUser(data)
    return data
  }

  const register = async (email, password, displayName) => {
    const { data } = await api.post('/auth/register', { email, password, displayName })
    setUser(data)
    return data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore */
    }
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
