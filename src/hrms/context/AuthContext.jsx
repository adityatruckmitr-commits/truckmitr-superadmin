import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { HRMS_USER_KEY, endConsoleSession } from '../env'

const AuthContext = createContext(null)

// The console login is the HRMS login: the HRMS profile of the signed-in console user is read
// from the backend (/profile + /my-profile) instead of a separate HRMS sign-in.
const loadProfile = async () => {
  const { data: user } = await api.get('/profile')
  try {
    const { data } = await api.get('/my-profile')
    return { ...user, ...data.employee }
  } catch {
    // If profile fetch fails, use basic user data
    return user
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HRMS_USER_KEY) || 'null')
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(!user)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const profile = await loadProfile()
      localStorage.setItem(HRMS_USER_KEY, JSON.stringify(profile))
      setUser(profile)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh on every visit to the HRMS section (a cached profile is shown meanwhile)
  useEffect(() => {
    load()
  }, [load])

  // Re-read the signed-in employee's profile so things like a new photo show up without logging in again.
  const refreshUser = load

  // Signing out of the HRMS signs out of the console (one login for everything)
  const logout = () => endConsoleSession()

  return (
    <AuthContext.Provider value={{ user, logout, loading, error, retry: load, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
