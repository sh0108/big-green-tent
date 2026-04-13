import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import DiscoveryPage from './pages/DiscoveryPage'
import AdminPage from './pages/AdminPage'
import AppShell from './components/AppShell'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

function PageTransition({ children }) {
  const MotionDiv = motion.div

  return (
    <MotionDiv
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      {children}
    </MotionDiv>
  )
}

function App() {
  const location = useLocation()

  return (
    <div className="app-shell font-body">
      <AppShell>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <DiscoveryPage />
                </PageTransition>
              }
            />
            <Route
              path="/admin"
              element={
                <PageTransition>
                  <AdminPage />
                </PageTransition>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </AppShell>
    </div>
  )
}

export default App
