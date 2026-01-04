import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data
    localStorage.setItem('token', token)
    setUser(user)
    return user
  }

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password })
    const { user, token } = response.data
    localStorage.setItem('token', token)
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const updateProfile = async (data) => {
    const response = await api.patch('/auth/profile', data)
    setUser(response.data.user)
    return response.data.user
  }

  const isAdmin = user?.role === 'ADMIN'
  const isEditor = user?.role === 'EDITOR' || user?.role === 'ADMIN'
  const isMember = !!user

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAdmin,
    isEditor,
    isMember,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
