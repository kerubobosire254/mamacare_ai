import { useNavigate } from 'react-router-dom'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import RegisterMother from './components/RegisterMother'
import Dashboard from './components/Dashboard'
import { useState } from 'react'

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0)
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>MamaCare AI</h1>
        <div className="tagline">Postnatal follow-up, by phone</div>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>
            Register mother
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="clinic-mark">C</div>
          <div>
            <div className="clinic-name">Clinic staff view</div>
            <div className="clinic-role">Postnatal care team</div>
          </div>
        </div>
      </aside>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard refreshKey={refreshKey} />} />
          <Route
            path="/register"
            element={
              <RegisterMother
                onRegistered={() => {
                  setRefreshKey((k) => k + 1)
                  navigate('/dashboard')
                }}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
