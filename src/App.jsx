import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import DiscoveryPage from './pages/DiscoveryPage'
import AdminPage from './pages/AdminPage'
import PersonalizePage from './pages/PersonalizePage'
import AppShell from './components/AppShell'

function App() {
  const location = useLocation()

  return (
    <div className="app-shell font-body">
      <AppShell>
        <Routes location={location}>
          <Route path="/" element={<DiscoveryPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/personalize" element={<PersonalizePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </div>
  )
}

export default App
