import { useEffect, useMemo, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Gauge,
  Info,
  Layers,
  ListChecks,
  MapPin,
  NotebookPen,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trees,
  X,
} from 'lucide-react'
import { Badge, Button, EmptyState, FieldLabel, Surface, TabButton } from '../components/ui'
import DiscoveryMap from '../components/DiscoveryMap'

const DEFAULT_SECTOR = 'Water Systems & Marine & Coastal Ecosystems'
const SECTOR_OPTIONS = [
  'All sectors',
  'Built Environment & Sustainable Transportation',
  'Climate Change & Adaptation',
  'Energy Systems',
  'Environmental Education & Communication',
  'Environmental Health',
  'Environmental Justice & Equity',
  'Food & Agriculture',
  'Green Finance & ESG',
  'Industrial Ecology & Circularity',
  'Land Conservation, Forests & Soils',
  'Law & Public Policy',
  'Water Systems & Marine & Coastal Ecosystems',
  'Science, Research & Innovation',
  'Wildlife & Biodiversity',
]
const DEFAULT_SCORE_THRESHOLD = 70
const WEBSITE_MATCH_OPTIONS = ['Confirmed', 'Partial', 'Unclear', 'Diverged', 'Not available']
const PROGRAM_FOCUS_OPTIONS = ['Highly Focused', 'Moderately Focused', 'Diversified', 'Sprawling', 'Tangential']
const CONFIDENCE_OPTIONS = [
  { value: 'ALL', label: 'Show all' },
  { value: 'HIGH_MEDIUM', label: 'High & Medium confidence only' },
  { value: 'HIGH_ONLY', label: 'High confidence only' },
]
const MATURITY_OPTIONS = [
  { value: 'All', label: 'All maturity levels' },
  { value: 'Emerging', label: 'Emerging (0-5 years of operation)' },
  { value: 'Established', label: 'Established (5-15 years of operation)' },
  { value: 'Mature', label: 'Mature (15+ years of operation)' },
]
const STATE_NAMES = {
  AK: 'Alaska',
  AL: 'Alabama',
  AR: 'Arkansas',
  AZ: 'Arizona',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  IA: 'Iowa',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  KY: 'Kentucky',
  MA: 'Massachusetts',
  MD: 'Maryland',
  ME: 'Maine',
  MI: 'Michigan',
  MN: 'Minnesota',
  MO: 'Missouri',
  MS: 'Mississippi',
  MT: 'Montana',
  NC: 'North Carolina',
  ND: 'North Dakota',
  NE: 'Nebraska',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NV: 'Nevada',
  NY: 'New York',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VA: 'Virginia',
  VT: 'Vermont',
  WA: 'Washington',
  WI: 'Wisconsin',
  WY: 'Wyoming',
}
const LEVEL_ORDER = ['Light', 'Medium', 'High']
const LEVEL_VALUES = { Light: 13, Medium: 25, High: 37 }
const CAPACITY_CONTROLS = [
  {
    key: 'fs',
    scoreKey: 'financialStability',
    label: 'Financial Stability',
    helper: 'Staying power and resilience',
    detail: 'Prioritize organizations with steadier long-term operating footing.',
    accent: '#9FE1CB',
    activeText: '#0d3023',
  },
  {
    key: 'rh',
    scoreKey: 'revenueHealth',
    label: 'Revenue Health',
    helper: 'Funding momentum and diversity',
    detail: 'Lift organizations with healthier revenue trends and funding mix.',
    accent: '#B5D4F4',
    activeText: '#0d3023',
  },
  {
    key: 'oe',
    scoreKey: 'operationalEfficiency',
    label: 'Operational Efficiency',
    helper: 'Program dollars at work',
    detail: 'Favor organizations that convert resources into program activity efficiently.',
    accent: '#FAC775',
    activeText: '#0d3023',
  },
  {
    key: 'om',
    scoreKey: 'organizationalMaturity',
    label: 'Organizational Maturity',
    helper: 'Readiness and operating depth',
    detail: 'Surface organizations with stronger depth, staffing, and continuity.',
    accent: '#D0CBF6',
    activeText: '#0d3023',
  },
]
const HUMAN_REVIEW_STEPS = [
  {
    key: 'programOutcomes',
    title: 'Verify Program Outcomes',
    description:
      'Cross-check the organization’s public claims against project pages, annual reports, or independently published impact summaries.',
    buildSourceUrl: (org) => `https://www.google.com/search?q=${encodeURIComponent(`${org.name} annual report projects`)}`,
  },
  {
    key: 'fieldReports',
    title: 'Review Field Reports',
    description:
      'Look outside the organization’s own materials for reporting, watchdog context, and how peers or local media describe the work.',
    buildSourceUrl: (org) => `https://www.google.com/search?q=${encodeURIComponent(`${org.name} news candid nonprofit`)}`,
  },
  {
    key: 'communityEngagement',
    title: 'Assess Community Engagement',
    description:
      'Check for leadership visibility, local accountability, and signs of rootedness that a top-line summary can miss.',
    buildSourceUrl: (org) => `https://www.google.com/search?q=${encodeURIComponent(`${org.name} team board community`)}`,
  },
  {
    key: 'financialData',
    title: 'Contextualize Financial Data',
    description:
      'Compare the internal score with source filings so budget, staffing, and continuity signals are grounded in public documentation.',
    buildSourceUrl: (org) => `https://projects.propublica.org/nonprofits/search?utf8=%E2%9C%93&q=${encodeURIComponent(org.name)}`,
  },
]

function clampScore(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  return Math.max(0, Math.min(100, Math.round(Number(value))))
}

function computeWeights(settings) {
  const raw = {
    fs: LEVEL_VALUES[settings.fs],
    rh: LEVEL_VALUES[settings.rh],
    oe: LEVEL_VALUES[settings.oe],
    om: LEVEL_VALUES[settings.om],
  }
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0)
  return {
    fs: raw.fs / total,
    rh: raw.rh / total,
    oe: raw.oe / total,
    om: raw.om / total,
  }
}

function computeWeightDistribution(settings) {
  const weights = computeWeights(settings)
  return CAPACITY_CONTROLS.map((control, index) => {
    const exact = weights[control.key] * 100
    if (index === CAPACITY_CONTROLS.length - 1) {
      const prior = CAPACITY_CONTROLS.slice(0, -1).reduce(
        (sum, priorControl) => sum + Math.round(weights[priorControl.key] * 100),
        0
      )
      return { ...control, percent: 100 - prior }
    }
    return { ...control, percent: Math.round(exact) }
  })
}

function computeOverallScore(org, weights) {
  const scores = org.scores || {}
  return Math.round(
    (Number(scores.financialStability?.score) || 0) * weights.fs +
      (Number(scores.revenueHealth?.score) || 0) * weights.rh +
      (Number(scores.operationalEfficiency?.score) || 0) * weights.oe +
      (Number(scores.organizationalMaturity?.score) || 0) * weights.om
  )
}

function confidenceMeta(band) {
  if (band === 'HIGH') return { tone: 'bg-grove/12 text-pine border-grove/30', label: 'High confidence' }
  if (band === 'MEDIUM') return { tone: 'bg-sun/16 text-forest border-sun/30', label: 'Medium confidence' }
  return { tone: 'bg-ember/10 text-ember border-ember/30', label: 'Low confidence' }
}

function websiteTone(match) {
  if (match === 'Confirmed') return 'grove'
  if (match === 'Partial') return 'sun'
  if (match === 'Diverged') return 'sky'
  return 'default'
}

function normalizedEligibilityLabel(org) {
  if (org.eligibilityFlag === 'below_revenue_band') {
    return 'Below BGT Revenue Band (500K minimum)'
  }
  if (org.eligibilityFlag === 'above_revenue_band') {
    return 'Above BGT Revenue Band (5M maximum)'
  }
  return org.eligibilityFlagLabel || null
}

function metricColorClass(color) {
  if (color === 'green') return 'text-pine'
  if (color === 'yellow') return 'text-[#B9831A]'
  if (color === 'red') return 'text-ember'
  return 'text-forest/40'
}

function getConfidenceMeaning(band) {
  if (band === 'HIGH') return 'All or nearly all capacity metrics were available from public filings.'
  if (band === 'MEDIUM') return 'Some capacity metrics were estimated or partially available.'
  return 'Several key metrics were missing; scores are based on limited data.'
}

function WeightMixIndicator({ distribution }) {
  const segments = distribution
    .map((item, index) => {
      const start = distribution.slice(0, index).reduce((sum, segment) => sum + segment.percent, 0)
      const end = start + item.percent
      return `${item.accent} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="rounded-[1.4rem] border border-forest/8 bg-white/72 px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-cta text-sm text-forest">Weighting mix</p>
          <p className="mt-1 text-xs leading-5 text-forest/56">
            These four category weights always normalize to a total of 100%.
          </p>
        </div>
        <div
          aria-hidden="true"
          className="h-16 w-16 shrink-0 rounded-full border border-white/85 shadow-[inset_0_0_0_10px_rgba(255,255,255,0.92)]"
          style={{ background: `conic-gradient(${segments})` }}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-full bg-forest/8">
        <div className="flex h-2.5 w-full">
          {distribution.map((item) => (
            <div key={item.key} style={{ width: `${item.percent}%`, backgroundColor: item.accent }} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {distribution.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 rounded-full bg-cream/82 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
              <span className="text-xs font-semibold text-forest">{item.label}</span>
            </div>
            <span className="text-xs font-semibold text-forest/62">{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeightToggle({ control, value, onChange, percent }) {
  const activeIndex = LEVEL_ORDER.indexOf(value)

  return (
    <div className="bg-transparent px-4 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-cta text-sm text-forest">{control.label}</p>
          <p className="mt-1 text-xs text-forest/50">{control.helper}</p>
        </div>
        <span className="rounded-full bg-forest/6 px-2.5 py-1 text-xs font-semibold text-forest/70">{percent}%</span>
      </div>

      <div className="relative grid grid-cols-3 rounded-full bg-[#F4F4F4] p-1" role="radiogroup" aria-label={control.label}>
        <Motion.div
          aria-hidden="true"
          className="absolute inset-y-1 rounded-full shadow-soft"
          animate={{
            left: `calc(${activeIndex * (100 / 3)}% + 0.25rem)`,
            width: 'calc(33.333% - 0.333rem)',
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          style={{ backgroundColor: control.accent }}
        />
        {LEVEL_ORDER.map((option) => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(control.key, option)}
              className={[
                'relative z-10 rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30',
                active ? '' : 'text-forest/62 hover:text-forest',
              ].join(' ')}
              style={active ? { color: control.activeText } : undefined}
            >
              {option}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-xs leading-5 text-forest/56">{control.detail}</p>
    </div>
  )
}

function HeroStat({ icon, label, value, sub, accent = 'default' }) {
  const iconClass = accent === 'sun' ? 'bg-sun text-forest' : 'bg-white/12 text-cream'
  return (
    <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/12 bg-white/8 px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconClass}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-cream/60">{label}</p>
        <p className="truncate font-cta text-lg text-cream">{value}</p>
        {sub ? <p className="text-xs text-cream/60">{sub}</p> : null}
      </div>
    </div>
  )
}

function HeroStep({ step, title, body, cta, onClick, disabled = false }) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-[1.3rem] border border-white/12 bg-white/8 px-4 py-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sun text-[0.7rem] font-semibold text-forest">{step}</span>
          <p className="font-cta text-sm text-cream">{title}</p>
        </div>
        <p className="text-sm leading-6 text-cream/74">{body}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-sun transition hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function ConfidencePill({ band }) {
  const meta = confidenceMeta(band)
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
}

function MatchScoreBox({ score }) {
  const normalized = clampScore(score) ?? 0
  return (
    <div className="min-w-[132px] rounded-[1.1rem] bg-forest px-4 py-3 text-cream">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-cream/62">Match score</p>
      <div className="mt-1 flex items-end gap-1">
        <span className="font-cta text-3xl">{normalized}</span>
        <span className="pb-1 text-xs text-cream/65">/100</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/12">
        <div className="h-full rounded-full bg-sun" style={{ width: `${normalized}%` }} />
      </div>
    </div>
  )
}

function FlagRow({ org }) {
  const hasRiskSignals = Array.isArray(org.riskSignals) && org.riskSignals.length > 0
  if (!org.notableSignals && !hasRiskSignals && !org.websiteConsistencySignal) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {org.notableSignals ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-grove/10 px-3 py-1.5 text-xs font-semibold text-pine">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {org.notableSignals}
        </span>
      ) : null}
      {hasRiskSignals ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sun/14 px-3 py-1.5 text-xs font-semibold text-forest">
          <AlertTriangle className="h-3.5 w-3.5" />
          {org.riskSignals.length} risk signal{org.riskSignals.length === 1 ? '' : 's'}
        </span>
      ) : null}
      {org.websiteConsistencySignal ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky/10 px-3 py-1.5 text-xs font-semibold text-forest">
          <Info className="h-3.5 w-3.5" />
          {org.websiteConsistencySignal}
        </span>
      ) : null}
    </div>
  )
}

function MissionBadgeRow({ org }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <span
        title={org.missionAlignmentRationale || undefined}
        className="inline-flex items-center gap-2 rounded-full border border-forest/8 bg-forest/4 px-3 py-1.5 text-xs font-semibold text-forest"
      >
        Mission alignment {org.missionAlignmentScore || 0}/5
      </span>
      {org.programFocus ? <Badge tone="grove">{org.programFocus}</Badge> : null}
      <Badge tone={websiteTone(org.websiteMissionMatch || 'Not available')}>{org.websiteMissionMatch || 'Not available'}</Badge>
    </div>
  )
}

function EligibilityBanner({ org }) {
  const label = normalizedEligibilityLabel(org)
  if (!label) return null
  const classes =
    org.eligibilityFlag === 'above_revenue_band'
      ? 'border-l-[5px] border-[#8970d9] bg-[#8970d9]/8 text-forest'
      : 'border-l-[5px] border-sun bg-sun/14 text-forest'
  return (
    <div className={`mb-4 rounded-[1.2rem] px-4 py-3 text-sm font-semibold ${classes}`}>
      {label}
    </div>
  )
}

function TopMatchCard({ org, score, saved, onOpen, onToggleShortlist, helperText, actionLabel }) {
  return (
    <div className="rounded-[1.8rem] border border-forest/8 bg-white/72 px-5 py-5 shadow-soft sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-cta text-[1.9rem] leading-tight text-forest">{org.name}</h3>
            <Badge tone="grove">{org.sector}</Badge>
            <Badge tone="sky">{org.maturityTier}</Badge>
            <ConfidencePill band={org.confidenceBand} />
          </div>

          <MissionBadgeRow org={org} />

          <p className="mt-3 text-sm font-medium text-forest/66">{org.state}</p>

          <div className="mt-4 space-y-2 text-sm leading-6 text-forest/72">
            {org.missionSummary ? <p>{org.missionSummary}</p> : null}
            {org.primaryPrograms ? <p>{org.primaryPrograms}</p> : null}
            {org.geographicScope ? <p>{org.geographicScope}</p> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 lg:items-end">
          <MatchScoreBox score={score} />
          <Button variant={saved ? 'secondary' : 'primary'} onClick={() => onToggleShortlist(org)}>
            {actionLabel}
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-sky/22 bg-sky/8 px-4 py-4">
        <p className="text-sm font-semibold text-forest">AI insight:</p>
        <p className="mt-2 text-sm leading-6 text-forest/72">{org.missionSummary || 'Mission summary not available.'}</p>
      </div>

      <FlagRow org={org} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-forest/52">{helperText}</p>
        <button
          type="button"
          onClick={() => onOpen(org)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-pine transition hover:text-forest"
        >
          Review details
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ScoreBreakdown({ org }) {
  const items = [
    ['Financial Stability', org.scores?.financialStability?.score, org.scores?.financialStability?.color],
    ['Revenue Health', org.scores?.revenueHealth?.score, org.scores?.revenueHealth?.color],
    ['Op. Efficiency', org.scores?.operationalEfficiency?.score, org.scores?.operationalEfficiency?.color],
    ['Org. Maturity', org.scores?.organizationalMaturity?.score, org.scores?.organizationalMaturity?.color],
  ]

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(([label, score, color]) => (
          <div key={label} className="rounded-[1.35rem] border border-forest/8 bg-white/72 px-4 py-4">
            <p className="text-[0.72rem] uppercase tracking-[0.16em] text-forest/52">{label}</p>
            <p className={`mt-3 font-cta text-4xl ${metricColorClass(color)}`}>{score ?? '—'}</p>
            <p className="text-xs text-forest/55">Out of 100</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-forest/58">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-pine" />All data available</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#C89420]" />1 metric missing</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ember" />2+ metrics missing</span>
      </div>
    </div>
  )
}

function ReviewerReminderCard({ step, org }) {
  return (
    <div className="rounded-[1.35rem] border border-white/14 bg-white/6 px-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/12 text-xs font-semibold text-cream">{step + 1}</span>
        <p className="font-cta text-sm text-cream">{HUMAN_REVIEW_STEPS[step].title}</p>
      </div>
      <p className="text-sm leading-6 text-cream/74">{HUMAN_REVIEW_STEPS[step].description}</p>
      <a
        href={HUMAN_REVIEW_STEPS[step].buildSourceUrl(org)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-sun px-4 py-2 text-sm font-semibold text-forest transition hover:bg-amber-300"
      >
        View Source Document
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

export default function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState('topMatches')
  const [filters, setFilters] = useState({
    sector: DEFAULT_SECTOR,
    state: 'ALL',
    maturityTier: 'All',
    minMissionAlignment: 1,
    programFocus: [...PROGRAM_FOCUS_OPTIONS],
    websiteMissionMatch: [...WEBSITE_MATCH_OPTIONS],
    confidenceBand: 'ALL',
    minScore: DEFAULT_SCORE_THRESHOLD,
  })
  const [weightSettings, setWeightSettings] = useState({
    fs: 'Medium',
    rh: 'Medium',
    oe: 'Medium',
    om: 'Medium',
  })
  const [orgs, setOrgs] = useState([])
  const [manualOrgs, setManualOrgs] = useState([])
  const [savedShortlist, setSavedShortlist] = useState([])
  const [notes, setNotes] = useState({})
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [revealedExplanation, setRevealedExplanation] = useState({})
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const res = await fetch('/api/approved')
        const data = await res.json()
        setSavedShortlist(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Fetch approved error:', error)
      }
    }
    loadSaved()
  }, [])

  const filterParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('sector', filters.sector)
    params.set('state', filters.state)
    params.set('maturityTier', filters.maturityTier)
    params.set('minMissionAlignment', String(filters.minMissionAlignment))
    params.set('confidenceBand', filters.confidenceBand)
    params.set('programFocus', filters.programFocus.join(','))
    params.set('websiteMissionMatch', filters.websiteMissionMatch.join(','))
    return params.toString()
  }, [filters])

  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const [mainRes, manualRes] = await Promise.all([
          fetch(`/api/orgs?${filterParams}`),
          fetch(`/api/orgs/manual?${filterParams}`),
        ])
        const [mainData, manualData] = await Promise.all([mainRes.json(), manualRes.json()])
        setOrgs(Array.isArray(mainData) ? mainData : [])
        setManualOrgs(Array.isArray(manualData) ? manualData : [])
      } catch (error) {
        console.error('Fetch org dataset error:', error)
      }
    }

    loadOrgs()
  }, [filterParams])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (activeTab !== 'shortlist') return undefined
    const timer = window.setTimeout(() => {
      document.getElementById('saved-shortlist-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [activeTab])

  const weights = useMemo(() => computeWeights(weightSettings), [weightSettings])
  const weightDistribution = useMemo(() => computeWeightDistribution(weightSettings), [weightSettings])

  const scoredOrgs = useMemo(() => {
    return orgs
      .map((org) => ({ ...org, computedOverallScore: computeOverallScore(org, weights) }))
      .sort((a, b) => {
        const scoreDelta = (b.computedOverallScore || 0) - (a.computedOverallScore || 0)
        if (scoreDelta) return scoreDelta
        return (b.missionAlignmentScore || 0) - (a.missionAlignmentScore || 0)
      })
  }, [orgs, weights])

  const scoredManualOrgs = useMemo(() => {
    return manualOrgs
      .map((org) => ({ ...org, computedOverallScore: computeOverallScore(org, weights) }))
      .sort((a, b) => {
        const alignDelta = (b.missionAlignmentScore || 0) - (a.missionAlignmentScore || 0)
        if (alignDelta) return alignDelta
        const order = { HIGH: 3, MEDIUM: 2, LOW: 1 }
        return (order[b.confidenceBand] || 0) - (order[a.confidenceBand] || 0)
      })
  }, [manualOrgs, weights])

  const shortlistedEins = useMemo(
    () => new Set(savedShortlist.map((item) => item.org_ein || item.ein).filter(Boolean)),
    [savedShortlist]
  )

  const topMatches = useMemo(
    () => scoredOrgs.filter((org) => (org.computedOverallScore || 0) >= filters.minScore),
    [filters.minScore, scoredOrgs]
  )

  const topMatch = topMatches[0] || null

  const matchStats = useMemo(() => {
    if (!topMatches.length) return null
    const avgScore = Math.round(
      topMatches.reduce((sum, org) => sum + (org.computedOverallScore || 0), 0) / topMatches.length
    )
    return {
      count: topMatches.length,
      avgScore,
      topSector: DEFAULT_SECTOR,
      topMatch,
    }
  }, [topMatches, topMatch])

  const shortlistCards = useMemo(() => {
    const byEin = new Map([...scoredOrgs, ...scoredManualOrgs].map((org) => [org.ein, org]))
    return savedShortlist
      .map((saved) => {
        const ein = saved.org_ein || saved.ein
        const match = byEin.get(ein)
        return match ? { ...match, approval_id: saved.approval_id, org_ein: ein } : null
      })
      .filter(Boolean)
  }, [savedShortlist, scoredManualOrgs, scoredOrgs])

  const stateOptions = useMemo(() => {
    const allStates = [...scoredOrgs, ...scoredManualOrgs]
      .map((org) => org.state)
      .filter(Boolean)
    return Array.from(new Set(allStates))
      .sort()
      .map((code) => ({ value: code, label: STATE_NAMES[code] || code }))
  }, [scoredManualOrgs, scoredOrgs])

  const filtersActive =
    filters.state !== 'ALL' ||
    filters.maturityTier !== 'All' ||
    filters.minMissionAlignment !== 1 ||
    filters.confidenceBand !== 'ALL' ||
    filters.minScore !== DEFAULT_SCORE_THRESHOLD ||
    filters.programFocus.length !== PROGRAM_FOCUS_OPTIONS.length ||
    filters.websiteMissionMatch.length !== WEBSITE_MATCH_OPTIONS.length ||
    Object.values(weightSettings).some((value) => value !== 'Medium')

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const toggleFilterListValue = (key, value, allValues) => {
    setFilters((current) => {
      const list = current[key]
      const next = list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]
      return {
        ...current,
        [key]: next.length ? next : [...allValues],
      }
    })
  }

  const resetFilters = () => {
    setFilters({
      sector: DEFAULT_SECTOR,
      state: 'ALL',
      maturityTier: 'All',
      minMissionAlignment: 1,
      programFocus: [...PROGRAM_FOCUS_OPTIONS],
      websiteMissionMatch: [...WEBSITE_MATCH_OPTIONS],
      confidenceBand: 'ALL',
      minScore: DEFAULT_SCORE_THRESHOLD,
    })
    setWeightSettings({
      fs: 'Medium',
      rh: 'Medium',
      oe: 'Medium',
      om: 'Medium',
    })
  }

  const scrollToSection = (id, delay = 0) => {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, delay)
  }

  const openOrg = async (org, options = {}) => {
    try {
      const res = await fetch(`/api/orgs/${org.ein}`)
      const data = await res.json()
      const nextOrg = res.ok ? { ...data, computedOverallScore: computeOverallScore(data, weights) } : org
      setSelectedOrg(nextOrg)
      if (options.autoRevealExplanation) {
        setLoadingPanel(true)
        setRevealedExplanation((current) => ({ ...current, [org.ein]: false }))
        window.setTimeout(() => {
          setLoadingPanel(false)
          setRevealedExplanation((current) => ({ ...current, [org.ein]: true }))
        }, 1500)
      }
    } catch (error) {
      console.error('Fetch org details error:', error)
      setSelectedOrg(org)
    }
  }

  const handleGenerateExplanation = (org) => {
    setSelectedOrg(org)
    setLoadingPanel(true)
    setRevealedExplanation((current) => ({ ...current, [org.ein]: false }))
    window.setTimeout(() => {
      setLoadingPanel(false)
      setRevealedExplanation((current) => ({ ...current, [org.ein]: true }))
    }, 1500)
  }

  const handleToggleShortlist = async (org) => {
    const existing = savedShortlist.find((item) => (item.org_ein || item.ein) === org.ein)
    if (existing) {
      try {
        const res = await fetch(`/api/approve/${existing.approval_id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Delete failed')
        setSavedShortlist((current) => current.filter((item) => item.approval_id !== existing.approval_id))
        setToast({ kind: 'success', message: `${org.name} was removed from the shortlist.` })
      } catch (error) {
        console.error(error)
        setToast({ kind: 'error', message: 'We could not remove that organization right now.' })
      }
      return
    }

    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_ein: org.ein, name: org.name, sector: org.sector }),
      })
      if (!res.ok) throw new Error('Save failed')
      const { id } = await res.json()
      setSavedShortlist((current) => [...current, { approval_id: id, org_ein: org.ein, name: org.name, sector: org.sector }])
      setToast({ kind: 'success', message: `${org.name} was added to the shortlist.` })
    } catch (error) {
      console.error(error)
      setToast({ kind: 'error', message: 'We could not save that organization right now.' })
    }
  }

  const saveNote = () => {
    if (!selectedOrg) return
    setToast({ kind: 'success', message: `Notes saved for ${selectedOrg.name}.` })
  }

  const selectedNote = selectedOrg ? notes[selectedOrg.ein] || '' : ''

  return (
    <div className="relative flex flex-col gap-8">
      <Surface strong className="dashboard-tent hero-marks relative overflow-hidden px-5 py-5 text-cream sm:px-7 sm:py-6">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2 text-cream/72">Discovery</p>
            <h1 className="font-cta text-3xl text-cream sm:text-4xl">Evaluate & shortlist nonprofits</h1>
            <p className="mt-2 text-sm leading-6 text-cream/78">
              {topMatches.length
                ? `${topMatches.length} matches under current filters · ${savedShortlist.length} on shortlist`
                : 'Adjust filters to surface candidates.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!filtersActive}
              className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-semibold text-cream transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Reset filters
            </button>
            {savedShortlist.length ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('shortlist')
                  setSelectedOrg(null)
                }}
                className="inline-flex items-center gap-2 rounded-full bg-sun px-4 py-2 text-sm font-semibold text-forest transition hover:bg-amber-300"
              >
                <ListChecks className="h-4 w-4" />
                View shortlist ({savedShortlist.length})
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HeroStat icon={<Target className="h-4 w-4" />} label="Matches" value={topMatches.length} accent="sun" />
          <HeroStat icon={<Gauge className="h-4 w-4" />} label="Avg score" value={matchStats ? `${matchStats.avgScore}` : '—'} sub={matchStats ? 'out of 100' : null} />
          <HeroStat icon={<Layers className="h-4 w-4" />} label="Top sector" value={DEFAULT_SECTOR} sub={topMatches.length ? `${topMatches.length} orgs` : null} />
          <HeroStat icon={<Sparkles className="h-4 w-4" />} label="Top match" value={topMatch?.name || 'None'} sub={topMatch ? `Score ${topMatch.computedOverallScore}` : null} />
        </div>

        <div className="relative z-10 mt-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/14" />
          <span className="text-[0.7rem] uppercase tracking-[0.18em] text-cream/58">Next steps</span>
          <span className="h-px flex-1 bg-white/14" />
        </div>

        <div className="relative z-10 mt-4 grid gap-3 md:grid-cols-3">
          <HeroStep
            step="1"
            title="Explain the top match"
            body={topMatch ? `Open ${topMatch.name} and reveal the capacity narrative.` : 'Surface a match to enable.'}
            cta="Generate explanation"
            onClick={() => {
              if (!topMatch) return
              setActiveTab('topMatches')
              openOrg(topMatch, { autoRevealExplanation: true })
              scrollToSection('selected-organization-panel', 250)
            }}
            disabled={!topMatch}
          />
          <HeroStep
            step="2"
            title="Review the shortlist"
            body={savedShortlist.length ? `${savedShortlist.length} approved ${savedShortlist.length === 1 ? 'org' : 'orgs'} ready for outreach.` : 'Save orgs to build your shortlist.'}
            cta="Open shortlist"
            onClick={() => {
              setActiveTab('shortlist')
              setSelectedOrg(null)
            }}
            disabled={!savedShortlist.length}
          />
          <HeroStep
            step="3"
            title={filtersActive ? 'Widen the lens' : 'Tune the lens'}
            body={filtersActive ? 'Reset filters to reopen the full candidate field.' : 'Adjust mission gates and category weights in the sidebar.'}
            cta={filtersActive ? 'Reset filters' : 'Focus sidebar'}
            onClick={() => {
              if (filtersActive) return resetFilters()
              document.getElementById('discovery-filters')?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </div>
      </Surface>

      <DiscoveryMap
        orgs={topMatches}
        approvedIds={shortlistedEins}
        stateFilter={filters.state}
        onStateChange={(state) => updateFilter('state', state)}
        onSelectOrg={(org) => {
          setActiveTab('topMatches')
          openOrg(org)
        }}
      />

      <section id="discovery-filters" className="grid gap-6 xl:grid-cols-[340px,minmax(0,1fr)]">
        <Surface className="h-fit px-5 py-5 sm:px-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">Filters</p>
              <h2 className="font-cta text-xl text-forest">Shape the lens</h2>
            </div>
            {filtersActive ? (
              <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-pine hover:text-forest">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            ) : null}
          </div>

          <div className="space-y-5">
            <div>
              <FieldLabel title="Environmental Sector" detail="Full taxonomy shown for client preview" />
              <select value={filters.sector} onChange={(event) => updateFilter('sector', event.target.value)} className="brand-input brand-select">
                {SECTOR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel title="State" detail="Map and dropdown stay in sync" />
              <select value={filters.state} onChange={(event) => updateFilter('state', event.target.value)} className="brand-input brand-select">
                <option value="ALL">All states</option>
                {stateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel title="Maturity" detail="Filter by lifecycle stage" />
              <select value={filters.maturityTier} onChange={(event) => updateFilter('maturityTier', event.target.value)} className="brand-input brand-select">
                {MATURITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel title="Minimum alignment score" detail="1 = minimal water connection · 5 = core water mission" />
              <div className="rounded-[1.35rem] border border-forest/8 bg-white/72 px-4 py-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={filters.minMissionAlignment}
                  onChange={(event) => updateFilter('minMissionAlignment', Number(event.target.value))}
                  className="range-track"
                />
                <div className="mt-3 flex items-center justify-between text-sm text-forest/60">
                  <span>1</span>
                  <span className="font-semibold text-forest">{filters.minMissionAlignment}</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            <ChecklistFilter
              title="Program Focus"
              detail="All remain checked by default"
              options={PROGRAM_FOCUS_OPTIONS}
              selected={filters.programFocus}
              onToggle={(value) => toggleFilterListValue('programFocus', value, PROGRAM_FOCUS_OPTIONS)}
            />

            <ChecklistFilter
              title="Website Mission Match"
              detail="Treat missing values as Not available"
              options={WEBSITE_MATCH_OPTIONS}
              selected={filters.websiteMissionMatch}
              onToggle={(value) => toggleFilterListValue('websiteMissionMatch', value, WEBSITE_MATCH_OPTIONS)}
            />

            <div>
              <FieldLabel title="Data Quality Gate" detail="Applies to Top Matches and Manual Review" />
              <div className="space-y-2 rounded-[1.35rem] border border-forest/8 bg-white/72 px-4 py-4">
                {CONFIDENCE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-3 text-sm text-forest">
                    <input
                      type="radio"
                      name="confidence-band"
                      checked={filters.confidenceBand === option.value}
                      onChange={() => updateFilter('confidenceBand', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel title="Minimum Score Threshold" detail="Affects Top Matches only" />
              <div className="rounded-[1.35rem] border border-forest/8 bg-white/72 px-4 py-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(event) => updateFilter('minScore', Math.max(0, Math.min(100, Number(event.target.value) || 0)))}
                  className="brand-input"
                />
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-forest/8 bg-white/72">
              <div className="px-4 pt-4">
                <p className="eyebrow mb-1">Capacity weighting</p>
                <h3 className="font-cta text-lg text-forest">Live score emphasis</h3>
                <p className="mt-2 text-sm leading-6 text-forest/60">
                  These controls rebalance the four fixed capacity scores without changing the stored source data.
                </p>
              </div>

              <div className="mt-4 divide-y divide-forest/6">
                {weightDistribution.map((control) => (
                  <WeightToggle
                    key={control.key}
                    control={control}
                    value={weightSettings[control.key]}
                    percent={control.percent}
                    onChange={(key, value) => setWeightSettings((current) => ({ ...current, [key]: value }))}
                  />
                ))}
              </div>
            </div>

            <WeightMixIndicator distribution={weightDistribution} />
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">Discovery tabs</p>
                <h2 className="font-cta text-3xl text-forest">Organizations worth a closer look</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <TabButton active={activeTab === 'topMatches'} count={topMatches.length} onClick={() => setActiveTab('topMatches')}>
                  Top Matches
                </TabButton>
                <TabButton active={activeTab === 'shortlist'} count={shortlistCards.length} onClick={() => setActiveTab('shortlist')}>
                  Saved Shortlist
                </TabButton>
                <TabButton active={activeTab === 'manualReview'} count={scoredManualOrgs.length} onClick={() => setActiveTab('manualReview')}>
                  Manual Review
                </TabButton>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {activeTab === 'topMatches' ? (
                topMatches.length ? (
                  topMatches.map((org) => (
                    <TopMatchCard
                      key={org.ein}
                      org={org}
                      score={org.computedOverallScore}
                      saved={shortlistedEins.has(org.ein)}
                      onOpen={(item) => {
                        openOrg(item)
                        scrollToSection('selected-organization-panel', 200)
                      }}
                      onToggleShortlist={handleToggleShortlist}
                      helperText="Top Matches are sorted by the live weighted score, then by mission alignment."
                      actionLabel={shortlistedEins.has(org.ein) ? 'Remove from Shortlist' : 'Save to Shortlist'}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<Trees className="h-7 w-7" />}
                    title="No New Organizations Match This Lens"
                    body="Try widening the mission filters, easing the threshold, or adjusting one or two weight settings to reopen the field."
                  />
                )
              ) : null}

              {activeTab === 'manualReview' ? (
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-sun/24 bg-sun/12 px-5 py-5 text-forest">
                    <p className="font-cta text-lg">Outside BGT Eligibility Band</p>
                    <p className="mt-2 text-sm leading-6 text-forest/76">
                      These organizations fall outside BGT&apos;s revenue criteria ($500K-$5M) for Phase 1 outreach. They appear here because qualitative mission and program data is available. Capacity scores are shown for context only.
                    </p>
                  </div>
                  {scoredManualOrgs.map((org) => (
                    <div key={org.ein}>
                      <EligibilityBanner org={org} />
                      <TopMatchCard
                        org={org}
                        score={org.computedOverallScore}
                        saved={shortlistedEins.has(org.ein)}
                        onOpen={(item) => {
                          openOrg(item)
                          scrollToSection('selected-organization-panel', 200)
                        }}
                        onToggleShortlist={handleToggleShortlist}
                        helperText="Manual Review cards are sorted by mission alignment first. Score is shown for reference only."
                        actionLabel={shortlistedEins.has(org.ein) ? 'Remove from Shortlist' : 'Save to Shortlist'}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === 'shortlist' ? (
                <div id="saved-shortlist-panel" className="space-y-4">
                  {shortlistCards.length ? (
                    shortlistCards.map((org) => (
                      <div key={org.approval_id} className="rounded-[1.8rem] border border-forest/8 bg-white/72 px-5 py-5 shadow-soft sm:px-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-cta text-[1.9rem] leading-tight text-forest">{org.name}</h3>
                              <Badge tone="grove">{org.sector}</Badge>
                              {org.maturityTier ? <Badge tone="sky">{org.maturityTier}</Badge> : null}
                              {org.confidenceBand ? <ConfidencePill band={org.confidenceBand} /> : null}
                              {normalizedEligibilityLabel(org) ? <Badge tone="sun">{normalizedEligibilityLabel(org)}</Badge> : null}
                            </div>
                            <p className="mt-3 text-sm font-medium text-forest/66">{org.state}</p>
                          </div>

                          <Button variant="secondary" onClick={() => handleToggleShortlist(org)}>
                            Remove From Shortlist
                          </Button>
                        </div>

                        <div className="mt-4 rounded-[1.4rem] border border-sky/22 bg-sky/8 px-4 py-4">
                          <p className="text-sm font-semibold text-forest">AI insight:</p>
                          <p className="mt-2 text-sm leading-6 text-forest/72">{org.missionSummary || 'Mission summary not available.'}</p>
                        </div>

                        <MissionBadgeRow org={org} />

                        <div className="mt-5">
                          <ScoreBreakdown org={org} />
                        </div>

                        {notes[org.ein] ? (
                          <div className="mt-5 rounded-[1.35rem] border border-forest/8 bg-white/7 px-4 py-4">
                            <p className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
                              <NotebookPen className="h-4 w-4" />
                              Reviewer Notes
                            </p>
                            <p className="mt-2 text-sm leading-6 text-forest/72">{notes[org.ein]}</p>
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={<CheckCircle2 className="h-7 w-7" />}
                      title="Your Shortlist Is Still Open"
                      body="Save organizations from Top Matches or Manual Review to build an outreach-ready set here."
                    />
                  )}
                </div>
              ) : null}
            </div>
          </Surface>

          {selectedOrg ? (
            <Surface id="selected-organization-panel" className="px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow mb-2">Selected organization</p>
                  <h2 className="font-cta text-4xl text-forest">{selectedOrg.name}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="grove">{selectedOrg.sector}</Badge>
                    {selectedOrg.maturityTier ? <Badge tone="sky">{selectedOrg.maturityTier}</Badge> : null}
                    {selectedOrg.state ? <Badge>{selectedOrg.state}</Badge> : null}
                    <ConfidencePill band={selectedOrg.confidenceBand} />
                    {normalizedEligibilityLabel(selectedOrg) ? <Badge tone="sun">{normalizedEligibilityLabel(selectedOrg)}</Badge> : null}
                  </div>
                  {selectedOrg.missionSummary ? (
                    <p className="mt-5 max-w-4xl border-l-4 border-sun pl-4 text-[1.05rem] leading-8 text-forest/72">{selectedOrg.missionSummary}</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrg(null)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-forest/10 bg-white/70 text-forest transition hover:bg-white"
                  aria-label="Close organization details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr),minmax(320px,0.9fr)]">
                <div className="space-y-5">
                  <div className="rounded-[1.5rem] border border-forest/8 bg-white/72 px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-forest/52">Data confidence</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${selectedOrg.confidenceBand === 'HIGH' ? 'bg-grove' : selectedOrg.confidenceBand === 'MEDIUM' ? 'bg-sun' : 'bg-ember'}`} />
                      <p className="font-semibold text-forest">{selectedOrg.confidenceBand}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-forest/72">{getConfidenceMeaning(selectedOrg.confidenceBand)}</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-forest/8 bg-white/72 px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-forest/52">Mission profile</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoBlock title="Mission Alignment" body={`${selectedOrg.missionAlignmentScore || 0}/5 · ${selectedOrg.missionAlignmentRationale || 'No rationale provided.'}`} />
                      <InfoBlock title="Program Focus" body={`${selectedOrg.programFocus || 'Not available'}${selectedOrg.programFocusRationale ? ` · ${selectedOrg.programFocusRationale}` : ''}`} />
                      <InfoBlock title="Geographic Scope" body={selectedOrg.geographicScope || 'Not available'} />
                      <InfoBlock title="Website Match" body={`${selectedOrg.websiteMissionMatch || 'Not available'}${selectedOrg.websiteRecentActivity ? ` · ${selectedOrg.websiteRecentActivity}` : ''}`} />
                    </div>
                    {selectedOrg.websiteUrl ? (
                      <a href={selectedOrg.websiteUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:text-forest">
                        Visit Website
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>

                  <div className="rounded-[1.7rem] border border-white/8 bg-forest px-5 py-5 text-cream shadow-lift">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-sun" />
                        <p className="font-cta text-lg text-cream">AI Explanation</p>
                      </div>
                      {revealedExplanation[selectedOrg.ein] ? (
                        <>
                          <p className="text-sm leading-7 text-cream/86">
                            {selectedOrg.capacityNarrative || 'Capacity narrative not yet generated for this organization.'}
                          </p>
                          {selectedOrg.missionStatement ? (
                            <div className="rounded-[1.2rem] border border-white/12 bg-white/8 px-4 py-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Mission statement</p>
                              <p className="mt-2 text-sm leading-6 text-cream/82">{selectedOrg.missionStatement}</p>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm leading-7 text-cream/78">
                            Generate the capacity-focused narrative for this organization when you are ready to inspect the reasoning.
                          </p>
                          <Button onClick={() => handleGenerateExplanation(selectedOrg)} disabled={loadingPanel}>
                            {loadingPanel ? 'Generating...' : 'Generate explanation'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedOrg.rawMetrics?.filingContinuityAdjustedNote ? (
                    <div className="rounded-[1.35rem] border border-sky/20 bg-sky/8 px-4 py-4">
                      <p className="font-semibold text-forest">Filing Continuity Adjusted</p>
                      <p className="mt-2 text-sm leading-6 text-forest/72">{selectedOrg.rawMetrics.filingContinuityAdjustedNote}</p>
                      <p className="mt-2 text-xs text-forest/55">
                        Score uses adjusted figure. Raw: {selectedOrg.rawMetrics.filingContinuityRaw ?? '—'}% → Adjusted: {selectedOrg.rawMetrics.filingContinuityAdjusted ?? '—'}%
                      </p>
                    </div>
                  ) : null}

                  <details className="rounded-[1.35rem] border border-forest/8 bg-white/72 px-4 py-4">
                    <summary className="cursor-pointer list-none font-cta text-sm text-forest">
                      <span className="inline-flex items-center gap-2">
                        Source Data
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </summary>
                    <div className="mt-4 grid gap-3 text-sm leading-6 text-forest/72">
                      {selectedOrg.program1Desc ? <InfoBlock title="Program 1" body={selectedOrg.program1Desc} /> : null}
                      {selectedOrg.program2Desc ? <InfoBlock title="Program 2" body={selectedOrg.program2Desc} /> : null}
                      {selectedOrg.program3Desc ? <InfoBlock title="Program 3" body={selectedOrg.program3Desc} /> : null}
                      {selectedOrg.scheduleO ? <InfoBlock title="Schedule O / Narrative" body={selectedOrg.scheduleO} /> : null}
                      {selectedOrg.websiteTextExcerpt ? <InfoBlock title="Website Excerpt" body={selectedOrg.websiteTextExcerpt} /> : null}
                    </div>
                  </details>

                  {selectedOrg.hardRedFlags ? (
                    <div className="rounded-[1.35rem] border border-ember/28 bg-ember/8 px-4 py-4">
                      <p className="font-semibold text-ember">Hard Red Flag</p>
                      <p className="mt-2 text-sm leading-6 text-forest/72">{selectedOrg.hardRedFlags}</p>
                    </div>
                  ) : null}

                  {selectedOrg.softFlags ? (
                    <div className="rounded-[1.35rem] border border-sun/30 bg-sun/10 px-4 py-4">
                      <p className="font-semibold text-forest">Soft Flag</p>
                      <p className="mt-2 text-sm leading-6 text-forest/72">{selectedOrg.softFlags}</p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-5">
                  <div className="rounded-[1.7rem] border border-white/8 bg-forest px-5 py-5 text-cream shadow-lift">
                    <div className="mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-sun" />
                      <p className="font-cta text-lg text-cream">Human evaluation reminders</p>
                    </div>
                    <div className="space-y-3">
                      {HUMAN_REVIEW_STEPS.map((_, index) => (
                        <ReviewerReminderCard key={HUMAN_REVIEW_STEPS[index].key} step={index} org={selectedOrg} />
                      ))}
                    </div>
                    <div className="mt-5">
                      <Button variant={shortlistedEins.has(selectedOrg.ein) ? 'secondary' : 'primary'} onClick={() => handleToggleShortlist(selectedOrg)}>
                        {shortlistedEins.has(selectedOrg.ein) ? 'Remove from Shortlist' : 'Save to Shortlist'}
                      </Button>
                      <p className="mt-3 text-xs text-cream/64">
                        Review the checkpoints above, then save when you&apos;re comfortable moving forward.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-forest/8 bg-white/72 px-4 py-4">
                    <label className="font-cta text-sm text-forest">Reviewer Notes</label>
                    <textarea
                      value={selectedNote}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [selectedOrg.ein]: event.target.value }))
                      }
                      rows={7}
                      placeholder="Add your notes after reviewing the checkpoints above..."
                      className="brand-input mt-3 min-h-[170px] resize-y"
                    />
                    <div className="mt-3 flex justify-end">
                      <Button onClick={saveNote}>Save Notes</Button>
                    </div>
                  </div>
                </div>
              </div>
            </Surface>
          ) : null}
        </div>
      </section>

      {toast ? (
        <div
          className={[
            'fixed bottom-6 right-6 z-50 rounded-full px-4 py-3 text-sm font-semibold shadow-lift',
            toast.kind === 'error' ? 'bg-ember text-white' : 'bg-forest text-cream',
          ].join(' ')}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}

function ChecklistFilter({ title, detail, options, selected, onToggle }) {
  return (
    <div>
      <FieldLabel title={title} detail={detail} />
      <div className="rounded-[1.35rem] border border-forest/8 bg-white/72 px-4 py-4">
        <div className="grid gap-2">
          {options.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-3 text-sm text-forest">
              <input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ title, body }) {
  return (
    <div className="rounded-[1.2rem] bg-forest/4 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-forest/52">{title}</p>
      <p className="mt-2 text-sm leading-6 text-forest/72">{body}</p>
    </div>
  )
}
