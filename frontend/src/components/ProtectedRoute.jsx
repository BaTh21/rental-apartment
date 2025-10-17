// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function ProtectedRoute({ children }) {
  const { user, isAuthenticated } = useAuth()

  if (!user || !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
