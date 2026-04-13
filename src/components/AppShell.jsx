import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Discovery' },
  { to: '/admin', label: 'Outreach' },
]

function linkClassName({ isActive }) {
  return [
    'cta-text rounded-full px-4 py-2 text-sm transition',
    isActive ? 'bg-forest text-cream shadow-lift' : 'text-forest/70 hover:bg-forest/5 hover:text-forest',
  ].join(' ')
}

export default function AppShell({ children }) {
  return (
    <div className="brand-shell page-noise">
      <div className="page-wrap">
        <header className="brand-card mb-8 flex flex-col gap-5 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest shadow-lift">
              <img src="/brand/BGT-Tent_Icon_Forest.svg" alt="" className="h-7 w-7 invert" />
            </div>
            <div>
              <p className="eyebrow mb-2">Big Green Tent</p>
              <h1 className="font-cta text-lg text-forest">Environmental discovery and outreach</h1>
              <p className="mt-1 text-sm text-forest/58">Internal dashboard for nonprofit evaluation, shortlisting, and outreach coordination</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClassName}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="stat-pill">
              <span className="h-2 w-2 rounded-full bg-grove" />
              Mission-led prototype
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
