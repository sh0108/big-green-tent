import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ClipboardList, Gauge, Layers, Mail, Search, Send, Sparkles, Users, X } from 'lucide-react'
import { Badge, Button, EmptyState, Surface } from '../components/ui'

const STAT_ACCENT = {
  forest: 'bg-forest text-cream',
  pine: 'bg-pine text-cream',
  sun: 'bg-sun text-forest',
  sky: 'bg-sky text-cream',
}

function StatTile({ icon, label, value, sub, accent = 'forest' }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.25rem] border border-forest/8 bg-white/72 px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${STAT_ACCENT[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-forest/55">{label}</p>
        <p className="truncate font-cta text-lg text-forest">{value}</p>
        {sub ? <p className="text-xs text-forest/55">{sub}</p> : null}
      </div>
    </div>
  )
}

function NextStep({ step, title, body, cta, onClick, disabled = false }) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-[1.4rem] border border-forest/8 bg-white/72 px-4 py-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-[0.7rem] font-semibold text-cream">
            {step}
          </span>
          <p className="font-cta text-sm text-forest">{title}</p>
        </div>
        <p className="text-sm leading-6 text-forest/70">{body}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-pine transition hover:text-forest disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function buildOutreachPackage(org) {
  return {
    subject: `Big Green Tent outreach: introduction to ${org.name}`,
    recipient: `Partnerships or development contact at ${org.name}`,
    summary: `Hello ${org.name} team, I’m reaching out from Big Green Tent. Our reviewer group recently shortlisted your organization because of its alignment with our environmental focus and the strength of your mission in ${org.sector}.`,
    context: `We are preparing the next round of outreach to organizations that stood out in our internal review workflow. Your work appears especially relevant for donors looking for high-trust, community-grounded environmental impact.`,
    ask: `We would love to schedule a short introductory conversation and request your current outreach materials, giving information, and any recent program updates you would like us to share with our internal reviewers.`,
    notes: `Prototype placeholder: this package is pre-filled for reviewers so they can quickly personalize, copy, and send without having to start from scratch.`,
  }
}

export default function AdminPage() {
  const MotionDiv = motion.div
  const navigate = useNavigate()
  const [approvedOrgs, setApprovedOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState(null)

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const res = await fetch('/api/approved')
        const data = await res.json()
        setApprovedOrgs(data)
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchApproved()
  }, [])

  const outreachPackage = selectedOrg ? buildOutreachPackage(selectedOrg) : null

  const stats = useMemo(() => {
    if (!approvedOrgs.length) return null
    const sectorCounts = approvedOrgs.reduce((acc, org) => {
      if (!org.sector) return acc
      acc[org.sector] = (acc[org.sector] || 0) + 1
      return acc
    }, {})
    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]
    const metricKeys = [
      'program_efficiency',
      'revenue_growth',
      'sustainability',
      'scale',
      'grant_distribution',
      'geographic_reach',
      'innovation_output',
    ]
    const scores = approvedOrgs.map((org) => {
      const vals = metricKeys.map((k) => Number(org[k]) || 0)
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length
      return Math.max(0, Math.min(100, avg * 50))
    })
    const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length
    return {
      sectors: Object.keys(sectorCounts).length,
      topSector: topSector ? { name: topSector[0], count: topSector[1] } : null,
      avgScore: Math.round(avgScore),
    }
  }, [approvedOrgs])

  const nextOrg = approvedOrgs[0]

  return (
    <div className="flex flex-col gap-6">
      <Surface strong className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">Outreach Dashboard</p>
            <h1 className="font-cta text-3xl text-forest sm:text-4xl">Approved organizations</h1>
            <p className="body-copy mt-2 text-sm">
              {loading
                ? 'Loading your shortlist…'
                : approvedOrgs.length
                  ? `${approvedOrgs.length} ${approvedOrgs.length === 1 ? 'org is' : 'orgs are'} ready for personalization and outreach.`
                  : 'Approve organizations from Discovery to start your outreach queue.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Find more candidates
            </Button>
            {nextOrg ? (
              <Button
                onClick={() => navigate('/admin/personalize', { state: { org: nextOrg } })}
                className="inline-flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Personalize next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={<Users className="h-4 w-4" />}
            label="Approved"
            value={loading ? '—' : approvedOrgs.length}
            accent="forest"
          />
          <StatTile
            icon={<Layers className="h-4 w-4" />}
            label="Sectors covered"
            value={loading ? '—' : stats?.sectors ?? 0}
            accent="pine"
          />
          <StatTile
            icon={<Sparkles className="h-4 w-4" />}
            label="Top sector"
            value={stats?.topSector ? stats.topSector.name : '—'}
            sub={stats?.topSector ? `${stats.topSector.count} orgs` : null}
            accent="sun"
          />
          <StatTile
            icon={<Gauge className="h-4 w-4" />}
            label="Avg readiness"
            value={stats ? `${stats.avgScore}` : '—'}
            sub={stats ? 'out of 100' : null}
            accent="sky"
          />
        </div>

        {!loading && approvedOrgs.length ? (
          <>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-forest/10" />
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-forest/55">Next steps</span>
              <span className="h-px flex-1 bg-forest/10" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
            <NextStep
              step="1"
              title="Personalize the next draft"
              body={nextOrg ? `Start with ${nextOrg.name}.` : 'Pick an org below to begin.'}
              cta="Open editor"
              onClick={() => nextOrg && navigate('/admin/personalize', { state: { org: nextOrg } })}
              disabled={!nextOrg}
            />
            <NextStep
              step="2"
              title="Review the full shortlist"
              body={`${approvedOrgs.length} ${approvedOrgs.length === 1 ? 'package' : 'packages'} waiting for a quick scan.`}
              cta="Jump to list"
              onClick={() => document.getElementById('approved-list')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <NextStep
              step="3"
              title="Expand the pipeline"
              body="Adjust weights and approve more from Discovery."
              cta="Open Discovery"
              onClick={() => navigate('/')}
            />
            </div>
          </>
        ) : null}
      </Surface>

      <Surface id="approved-list" className="px-5 py-5 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-3">Approved Set</p>
            <h2 className="font-cta text-3xl text-forest">
              {loading ? 'Loading Outreach List...' : `${approvedOrgs.length} Organizations Ready To Contact`}
            </h2>
          </div>
          <Badge tone="sun">Backend Untouched</Badge>
        </div>

        {outreachPackage ? (
          <div className="mb-6 rounded-[1.9rem] border border-forest/10 bg-forest px-5 py-5 text-cream shadow-lift sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-sun" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cream/74">Pre-Filled Outreach Package</p>
                </div>
                <h3 className="font-cta text-2xl text-cream">{selectedOrg.name}</h3>
                <p className="mt-2 text-sm leading-6 text-cream/78">
                  Prototype-only reviewer handoff. This is a visual placeholder for the future outreach workflow and does not send email or call any AI service.
                </p>
              </div>

              <button
                onClick={() => setSelectedOrg(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/8 text-cream transition hover:bg-white/14"
                aria-label="Close outreach package"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr),340px]">
              <div className="rounded-[1.5rem] border border-white/12 bg-white/6 px-4 py-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Suggested Recipient</p>
                    <p className="mt-2 text-sm leading-6 text-cream">{outreachPackage.recipient}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Subject Line</p>
                    <p className="mt-2 text-sm leading-6 text-cream">{outreachPackage.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Pre-Filled Message</p>
                    <div className="mt-2 rounded-[1.2rem] bg-black/10 px-4 py-4 text-sm leading-7 text-cream/92">
                      <p>{outreachPackage.summary}</p>
                      <p className="mt-4">{outreachPackage.context}</p>
                      <p className="mt-4">{outreachPackage.ask}</p>
                      <p className="mt-4 text-cream/74">{outreachPackage.notes}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-white/12 bg-white/6 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Package Contents</p>
                  <div className="mt-3 space-y-3 text-sm text-cream/88">
                    <div className="rounded-[1rem] bg-white/8 px-3 py-3">Organization Summary From Shortlist Review</div>
                    <div className="rounded-[1rem] bg-white/8 px-3 py-3">Sector Tag: {selectedOrg.sector}</div>
                    <div className="rounded-[1rem] bg-white/8 px-3 py-3">Mission Statement For Reviewer Reference</div>
                    <div className="rounded-[1rem] bg-white/8 px-3 py-3">Suggested Intro Request And Follow-Up Prompt</div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/12 bg-white/6 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Reviewer Action</p>
                  <p className="mt-3 text-sm leading-6 text-cream/82">
                    Review the draft, personalize tone or asks as needed, then copy this into your actual email workflow.
                  </p>
                  <button
                    onClick={() => navigate('/admin/personalize', { state: { org: selectedOrg } })}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 text-sm font-semibold text-forest transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky"
                    aria-label={`Personalize outreach package for ${selectedOrg?.name}`}
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Personalize This Package
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {!loading && approvedOrgs.length === 0 ? (
            <EmptyState
              icon={<Mail className="h-7 w-7" />}
              title="No Organizations Have Been Approved Yet"
              body="As you approve organizations from the discovery workspace, they will appear here as your first outreach set."
              linkTo="/"
              linkLabel="Return To Discovery"
            />
          ) : null}

          {approvedOrgs.map((org, index) => (
            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={org.id}
              className="grid gap-4 rounded-[1.8rem] border border-forest/8 bg-white/72 px-5 py-5 shadow-soft lg:grid-cols-[minmax(0,1fr),auto] lg:items-center sm:px-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-lg font-semibold text-cream">
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-cta text-2xl text-forest">{org.name}</h3>
                    <Badge tone="grove">{org.sector}</Badge>
                  </div>
                  <p className="body-copy mt-2 max-w-3xl">{org.mission}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="stat-pill">Approved For Outreach</span>
                    <span className="stat-pill">Discovery Shortlisting Preserved</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-start lg:justify-end">
                <Button className="min-w-[170px]" onClick={() => setSelectedOrg(org)}>
                  Contact Package
                </Button>
              </div>
            </MotionDiv>
          ))}
        </div>
      </Surface>
    </div>
  )
}
