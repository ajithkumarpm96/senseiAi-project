/**
 * App.jsx - Root Component
 *
 * React Router lives here - decides which Page to render based on URL.
 * Think of this like Express router but for the frontend.
 *
 * Route structure:
 *   /login          -> LoginPage  (public)
 *   /               -> HomePage   (projects list, protected)
 *   /study/:id      -> StudyPage  (chat session, protected)
 *   /progress       -> ProgressPage (dashboard, protected)
 *   /admin          -> AdminPage  (kill switch + usage, protected)
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import StudyPage from './pages/StudyPage'
import ProgressPage from './pages/ProgressPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import { useAppStore } from './store/appStore'

// ProtectedRoute: wraps pages that require auth
// If no token in store -> redirect to /login
// Analogy: like an Express middleware that checks req.user before the handler
function ProtectedRoute({ children }) {
  const token = useAppStore((state) => state.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/study/:projectId" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
