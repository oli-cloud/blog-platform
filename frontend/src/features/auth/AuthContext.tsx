import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import api from '../../services/api'
import type { User } from '../../types'

interface AuthValue { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; register: (value: {email:string; username:string; password:string; display_name:string}) => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    api.get<User>('/auth/me').then(({ data }) => setUser(data)).catch(() => localStorage.removeItem('accessToken')).finally(() => setLoading(false))
  }, [])
  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.access_token)
    localStorage.setItem('refreshToken', data.refresh_token)
    const me = await api.get<User>('/auth/me')
    setUser(me.data)
  }
  const register = async (value: {email:string; username:string; password:string; display_name:string}) => {
    await api.post('/auth/register', value)
    await login(value.email, value.password)
  }
  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => undefined)
    localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); setUser(null)
  }
  return <AuthContext.Provider value={{ user, loading, login, logout, register }}>{children}</AuthContext.Provider>
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context }
