import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Mothers from './pages/Mothers'
import MotherProfile from './pages/MotherProfile'
import FollowUps from './pages/FollowUps'
import Escalations from './pages/Escalations'
import Analytics from './pages/Analytics'
import RegisterMother from './pages/RegisterMother'

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
      <span>{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="mark">M</div>
          <h1>MamaCare AI</h1>
        </div>
        <div className="tagline">Postnatal follow-up, by phone</div>

        <nav>
          <NavItem to="/" end icon="🏠" label="Dashboard" />
          <NavItem to="/mothers" icon="👩🏾" label="Mothers" />
          <NavItem to="/follow-ups" icon="📞" label="Follow-ups" />
          <NavItem to="/escalations" icon="🚨" label="Escalations" />
          <NavItem to="/analytics" icon="📊" label="Analytics" />
          <NavItem to="/register" icon="➕" label="Register mother" />
        </nav>

        <div className="sidebar-footer">
          Built for CALL-E: Your Code Is Calling
        </div>
      </aside>

      <div>
        <div className="topbar">
          <div />
          <div className="user-chip">
            <div className="avatar">G</div>
            Nurse Grace
          </div>
        </div>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mothers" element={<Mothers />} />
            <Route path="/mothers/:id" element={<MotherProfile />} />
            <Route path="/follow-ups" element={<FollowUps />} />
            <Route path="/escalations" element={<Escalations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/register" element={<RegisterMother />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
