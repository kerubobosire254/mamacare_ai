import { useState } from 'react'
import RegisterMother from './components/RegisterMother'
import Dashboard from './components/Dashboard'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>MamaCare AI</h1>
        <div className="tagline">Postnatal follow-up, by phone</div>
        <nav>
          <a
            className={page === 'dashboard' ? 'active' : ''}
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </a>
          <a
            className={page === 'register' ? 'active' : ''}
            onClick={() => setPage('register')}
          >
            Register mother
          </a>
        </nav>
      </aside>

      <main>
        {page === 'dashboard' && <Dashboard refreshKey={refreshKey} />}
        {page === 'register' && (
          <RegisterMother onRegistered={() => { setRefreshKey((k) => k + 1); setPage('dashboard') }} />
        )}
      </main>
    </div>
  )
}
