import { useState } from 'react'
import { motion } from 'framer-motion'
import NavBar from '../components/NavBar'

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const industryColors = {
  Tech: 'bg-violet-100 text-violet-800 border-violet-200',
  Healthcare: 'bg-rose-100 text-rose-800 border-rose-200',
  Education: 'bg-sky-100 text-sky-800 border-sky-200',
  Other: 'bg-slate-100 text-slate-600 border-slate-200',
}

const industryBadge = {
  Tech: 'bg-violet-100 text-violet-700',
  Healthcare: 'bg-rose-100 text-rose-700',
  Education: 'bg-sky-100 text-sky-700',
  Other: 'bg-slate-100 text-slate-600',
}

function SummaryStats({ applications }) {
  const validRevenues = applications
    .map(a => a.annual_revenue)
    .filter(v => v != null && !isNaN(v))

  const avgRevenue = validRevenues.length > 0
    ? validRevenues.reduce((s, v) => s + v, 0) / validRevenues.length
    : 0

  const industryCounts = applications.reduce((acc, app) => {
    const ind = app.industry || 'Other'
    acc[ind] = (acc[ind] || 0) + 1
    return acc
  }, {})

  const formatCurrency = (val) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
    return `$${val.toFixed(0)}`
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10"
    >
      <motion.div
        variants={cardVariants}
        className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm"
      >
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Avg. Revenue</p>
        <p className="text-3xl font-bold text-blue-700">{formatCurrency(avgRevenue)}</p>
        <p className="text-xs text-slate-500 mt-1">across {validRevenues.length} entries</p>
      </motion.div>

      {['Tech', 'Healthcare', 'Education', 'Other'].map((ind) => (
        <motion.div
          key={ind}
          variants={cardVariants}
          className={`rounded-2xl border p-6 shadow-sm ${industryColors[ind]}`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 opacity-70">{ind}</p>
          <p className="text-3xl font-bold">{industryCounts[ind] || 0}</p>
          <p className="text-xs mt-1 opacity-60">applications</p>
        </motion.div>
      ))}
    </motion.div>
  )
}

function exportCSV(applications) {
  const headers = ['ID', 'Created At', 'Company Name', 'Mission', 'Annual Revenue', 'Team Size', 'Industry']
  const escapeCSV = (val) => {
    const str = val == null ? '' : String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const rows = applications.map(app => [
    app.id,
    app.createdAt,
    app.company_name,
    app.mission,
    app.annual_revenue,
    app.team_size,
    app.industry,
  ].map(escapeCSV).join(','))

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `simplify_applications_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [applications, setApplications] = useState([])
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/applications', {
        headers: { 'Authorization': password }
      })
      if (!response.ok) throw new Error('Invalid password')
      const data = await response.json()
      setApplications(data)
      setIsAuthenticated(true)
      setError('')
    } catch (err) {
      setError('Incorrect password.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 font-body flex flex-col items-center justify-center">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h2 className="text-2xl font-bold text-ink mb-2">Admin Login</h2>
          <p className="text-sm text-slate-500 mb-6">Enter password to view submissions.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password..."
              className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-ink outline-none transition-colors focus:border-blue-500 focus:bg-white"
            />
            {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            <button
              type="submit"
              className="rounded-full bg-ink px-8 py-3 text-white font-semibold shadow-sm transition hover:opacity-90 mt-2"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-body">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold tracking-[-0.02em] text-ink">
            Submitted Applications
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportCSV(applications)}
              disabled={applications.length === 0}
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⬇ Export CSV
            </button>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
              Total: {applications.length}
            </span>
          </div>
        </div>

        {applications.length > 0 && <SummaryStats applications={applications} />}
        
        {applications.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            No applications submitted yet.
          </div>
        ) : (
          <motion.div
            className="grid gap-6"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {applications.map((app) => (
              <motion.div
                key={app.id}
                variants={cardVariants}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col gap-4"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-ink">{app.company_name || 'Unnamed'}</span>
                    {app.industry && (
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${industryBadge[app.industry] || industryBadge.Other}`}>
                        {app.industry}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    {app.score != null && (
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50">
                        {app.score}
                      </div>
                    )}
                    <div className="text-sm font-semibold text-slate-500">
                      {new Date(app.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  <div className="lg:col-span-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">Mission Statement</span>
                    <p className="font-medium text-ink leading-relaxed">{app.mission || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">Annual Revenue</span>
                    <p className="font-medium text-ink">
                      {app.annual_revenue != null ? `$${Number(app.annual_revenue).toLocaleString()}` : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">Team Size</span>
                    <p className="font-medium text-ink">
                      {app.team_size != null ? Number(app.team_size).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
