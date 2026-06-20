import { useState, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('dm-user')
    return saved ? JSON.parse(saved) : null
  })
  const navigate = useNavigate()

  const handleLogin = useCallback((profile) => {
    const u = { name: profile.name || 'Administrator', email: profile.email, company: profile.company }
    sessionStorage.setItem('dm-user', JSON.stringify(u))
    setUser(u)
    navigate('/home')
  }, [navigate])

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('dm-user')
    setUser(null)
    navigate('/login')
  }, [navigate])

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />}
      />
      <Route
        path="/home"
        element={user ? <Home user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={user ? '/home' : '/login'} replace />} />
    </Routes>
  )
}
