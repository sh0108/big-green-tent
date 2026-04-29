import { NavLink } from 'react-router-dom'
import { CircleUserRound, LogOut, ShieldCheck } from 'lucide-react'

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
        <header className="brand-card mb-8 flex flex-col gap-4 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white/75 shadow-soft">
              <img src="/brand/BGT-Tent_Icon_Forest.svg" alt="Big Green Tent logo" className="h-10 w-10" />
            </div>
            <div className="min-w-0">
              <div className="font-cta text-[clamp(1.75rem,3vw,2.4rem)] leading-none text-forest">
                Big Green Tent
              </div>
              <h1 className="mt-2 min-w-0 font-cta text-base text-forest/82 sm:text-lg">Reviewer Workspace</h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <nav className="flex flex-wrap gap-2" aria-label="Primary">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClassName}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <div className="stat-pill whitespace-nowrap">
                <ShieldCheck className="h-3.5 w-3.5 text-grove" />
                Reviewer Access
              </div>
              <div className="flex items-center gap-2 rounded-full border border-forest/10 bg-white/72 px-4 py-2 text-sm text-forest/72 whitespace-nowrap">
                <CircleUserRound className="h-4 w-4 text-forest/58" />
                Jane Smith
              </div>
              <button className="brand-button-secondary px-4 py-2 whitespace-nowrap" type="button" aria-label="Log out">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
