import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentHome from './pages/StudentHome'
import VariantPage from './pages/VariantPage'
import TeacherHome from './pages/TeacherHome'
import TeacherSubtopic from './pages/TeacherSubtopic'
import AdminPage from './pages/AdminPage'

function Private({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="container muted">Загрузка…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <Private>
              <StudentHome />
            </Private>
          }
        />
        <Route
          path="/variant"
          element={
            <Private>
              <VariantPage />
            </Private>
          }
        />
        <Route
          path="/teacher"
          element={
            <Private>
              <TeacherHome />
            </Private>
          }
        />
        <Route
          path="/teacher/subtopic/:id"
          element={
            <Private>
              <TeacherSubtopic />
            </Private>
          }
        />
        <Route
          path="/admin"
          element={
            <Private>
              <AdminPage />
            </Private>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
