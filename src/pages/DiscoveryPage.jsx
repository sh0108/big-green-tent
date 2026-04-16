import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ExternalLink, Leaf, MapPin, Sparkles, Trees, X } from 'lucide-react'
import { Badge, Button, EmptyState, FieldLabel, SectionHeading, Surface, TabButton } from '../components/ui'

const sectorOptions = [
  'All',
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

const maturityOptions = ['All', 'Emerging', 'Established', 'Mature']

const weightFields = [
  ['efficiency', 'Program efficiency'],
  ['growth', 'Revenue growth'],
  ['sustainability', 'Sustainability'],
  ['scale', 'Scale'],
  ['grant_distribution', 'Grant distribution'],
  ['geographic_reach', 'Geographic reach'],
  ['innovation_output', 'Innovation output'],
]

const metricFields = [
  ['program_efficiency', 'Efficiency'],
  ['revenue_growth', 'Growth'],
  ['sustainability', 'Sustainability'],
  ['scale', 'Scale'],
  ['grant_distribution', 'Grant reach'],
  ['geographic_reach', 'Footprint'],
  ['innovation_output', 'Innovation'],
]

const dueDiligenceSteps = [
  {
    key: 'programOutcomes',
    title: 'Verify Program Outcomes',
    description: 'AI flagged likely impact claims in the organization materials. Confirm those claims against project pages or an annual report before approval.',
    getSource: (org) => ({
      label: 'View Source Document',
      href: `https://www.google.com/search?q=${encodeURIComponent(`${org.name} annual report projects`)}`,
    }),
  },
  {
    key: 'fieldReports',
    title: 'Review Field Reports',
    description: 'Check how the organization is described outside its own materials. Look for reporting, watchdog context, or recent public-facing updates.',
    getSource: (org) => ({
      label: 'View Source Document',
      href: `https://www.google.com/search?q=${encodeURIComponent(`${org.name} news candid nonprofit`)}`,
    }),
  },
  {
    key: 'communityEngagement',
    title: 'Assess Community Engagement',
    description: 'Review signs of local accountability, leadership visibility, and community presence that may not appear in high-level summaries alone.',
    getSource: (org) => ({
      label: 'View Source Document',
      href: `https://www.google.com/search?q=${encodeURIComponent(`${org.name} team board community`)}`,
    }),
  },
  {
    key: 'financialData',
    title: 'Contextualize Financial Data',
    description: 'Cross-check the organization’s financial profile with independent filings so budget size, scale, and giving posture are grounded in source data.',
    getSource: (org) => ({
      label: 'View Source Document',
      href: `https://projects.propublica.org/nonprofits/search?utf8=%E2%9C%93&q=${encodeURIComponent(org.name)}`,
    }),
  },
]

function getWeightTemperature(value) {
  if (value >= 1.6) return 'High'
  if (value >= 1.1) return 'Balanced'
  return 'Light'
}

export default function DiscoveryPage() {
  const MotionButton = motion.button
  const MotionDiv = motion.div
  const [sector, setSector] = useState('All')
  const [maturity, setMaturity] = useState('All')
  const [weights, setWeights] = useState({
    efficiency: 1,
    growth: 1,
    sustainability: 1,
    scale: 1,
    grant_distribution: 1,
    geographic_reach: 1,
    innovation_output: 1,
  })
  const [activeTab, setActiveTab] = useState('matches')
  const [results, setResults] = useState([])
  const [savedNonprofits, setSavedNonprofits] = useState([])
  const [selectedNonprofit, setSelectedNonprofit] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [loadingExplain, setLoadingExplain] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await fetch('/api/approved')
        const data = await res.json()
        setSavedNonprofits(data)
      } catch (err) {
        console.error('Fetch saved error:', err)
      }
    }
    fetchSaved()
  }, [])

  useEffect(() => {
    const fetchResults = async () => {
      const params = new URLSearchParams()
      if (sector !== 'All') params.append('sector', sector)
      if (maturity !== 'All') params.append('maturity', maturity)
      params.append('efficiency', weights.efficiency)
      params.append('growth', weights.growth)
      params.append('sustainability', weights.sustainability)
      params.append('scale', weights.scale)
      params.append('grant_distribution', weights.grant_distribution)
      params.append('geographic_reach', weights.geographic_reach)
      params.append('innovation_output', weights.innovation_output)

      try {
        const res = await fetch(`/api/nonprofits?${params.toString()}`)
        const data = await res.json()
        setResults(data)
      } catch (err) {
        console.error('Fetch matches error:', err)
      }
    }

    fetchResults()
  }, [sector, maturity, weights])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const handleWeightChange = (key, value) => {
    setWeights((prev) => ({ ...prev, [key]: parseFloat(value) }))
  }

  const handleExplain = async (nonprofit) => {
    setSelectedNonprofit(nonprofit)
    setExplanation('')
    setLoadingExplain(true)

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonprofit, weights }),
      })
      const data = await res.json()
      setExplanation(data.explanation || 'No explanation was returned for this organization.')
    } catch (err) {
      console.error(err)
      setExplanation('Failed to generate explanation. Please try again.')
    } finally {
      setLoadingExplain(false)
    }
  }

  const handleApprove = async (org) => {
    try {
      const payload = { nonprofit_id: org.id, name: org.name, sector: org.sector }
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to approve')

      const { id } = await res.json()
      setSavedNonprofits((prev) => [...prev, { ...org, approval_id: id, nonprofit_id: org.id }])
      setSelectedNonprofit(null)
      setToast({ kind: 'success', message: `${org.name} moved into the outreach shortlist.` })
    } catch (err) {
      console.error(err)
      setToast({ kind: 'error', message: 'We could not add that organization right now.' })
    }
  }

  const handleRemove = async (orgId, orgName, event) => {
    if (event) event.stopPropagation()
    try {
      const res = await fetch(`/api/approve/${orgId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      setSavedNonprofits((prev) => prev.filter((saved) => saved.nonprofit_id !== orgId))
      setToast({ kind: 'success', message: `${orgName} was removed from the shortlist.` })
    } catch (err) {
      console.error(err)
      setToast({ kind: 'error', message: 'We could not remove that organization right now.' })
    }
  }

  const savedIds = new Set(savedNonprofits.map((saved) => saved.nonprofit_id))
  const filteredMatches = results.filter((org) => !savedIds.has(org.id))
  const highlightedResult = filteredMatches[0]

  return (
    <div className="relative flex flex-col gap-8">
      <Surface strong className="dashboard-tent hero-marks relative overflow-hidden px-6 py-6 text-cream sm:px-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.35fr),320px] lg:items-start">
          <div className="max-w-3xl">
            <p className="eyebrow mb-3 text-cream/72">Discovery dashboard</p>
            <h1 className="font-cta text-[clamp(2rem,5vw,3.4rem)] leading-tight text-cream">
              Internal workspace for evaluating and shortlisting environmental nonprofits
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-cream/84">
              Compare vetted organizations, tune scoring priorities, generate AI explanations, and move promising groups into the outreach pipeline with accessible, task-first controls.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cream/62">Available matches</p>
                <p className="mt-2 font-cta text-3xl text-cream">{filteredMatches.length}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cream/62">Saved shortlist</p>
                <p className="mt-2 font-cta text-3xl text-cream">{savedNonprofits.length}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cream/62">Current sector</p>
                <p className="mt-2 font-cta text-lg text-cream">{sector === 'All' ? 'All sectors' : sector}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-white/12 bg-white/8 px-5 py-5">
            <p className="eyebrow mb-3 text-cream/70">Queue snapshot</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Top current match</p>
                <p className="mt-2 font-cta text-xl text-cream">{highlightedResult?.name || 'No active match'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cream/58">AI review status</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-cream/84">
                  <Sparkles className="h-4 w-4 text-sun" />
                  Ready on demand
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Primary workflow</p>
                <p className="mt-2 text-sm leading-6 text-cream/78">Filter, compare, explain, approve, then transition to outreach.</p>
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <section className="grid gap-6 xl:grid-cols-[340px,minmax(0,1fr)]">
        <Surface className="h-fit px-5 py-6 sm:px-6">
          <div className="mb-6">
            <p className="eyebrow mb-3">Stewardship settings</p>
            <h2 className="font-cta text-2xl text-forest">Shape the discovery lens</h2>
            <p className="body-copy mt-3 text-sm">
              Tune for organizations that match your goals, maturity preferences, and impact priorities without changing the underlying scoring engine.
            </p>
          </div>

          <div className="brand-divider mb-6" />

          <div className="space-y-5">
            <div>
              <FieldLabel title="Environmental sector" detail="Choose a thematic focus" />
              <select value={sector} onChange={(event) => setSector(event.target.value)} className="brand-input brand-select">
                {sectorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All sectors' : option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel title="Organization maturity" detail="Filter by lifecycle stage" />
              <select value={maturity} onChange={(event) => setMaturity(event.target.value)} className="brand-input brand-select">
                {maturityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All stages' : option}
                  </option>
                ))}
              </select>
            </div>

            <Surface className="soft-grid px-4 py-4">
              <p className="eyebrow mb-4">Impact weighting</p>
              <div className="space-y-4">
                {weightFields.map(([key, label]) => (
                  <div key={key}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-cta text-sm capitalize text-forest">{label}</p>
                        <p className="text-xs text-forest/48">{getWeightTemperature(weights[key])} emphasis</p>
                      </div>
                      <span className="rounded-full bg-forest/6 px-2.5 py-1 text-xs font-semibold text-forest">{weights[key].toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={weights[key]}
                      onChange={(event) => handleWeightChange(key, event.target.value)}
                      className="range-track"
                    />
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="overflow-hidden px-6 py-6 sm:px-8">
            <SectionHeading
              eyebrow="Workspace overview"
              title="Compare organizations with clearer operational context"
              accent="Dashboard-first, still brand-aligned"
              body="The core scoring and approval logic remain unchanged, but the interface now prioritizes scanability, focus management, and high-clarity decision support."
            />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <TabButton active={activeTab === 'matches'} count={filteredMatches.length} onClick={() => { setActiveTab('matches'); setSelectedNonprofit(null) }}>
                Top matches
              </TabButton>
              <TabButton active={activeTab === 'saved'} count={savedNonprofits.length} onClick={() => { setActiveTab('saved'); setSelectedNonprofit(null) }}>
                Saved shortlist
              </TabButton>
            </div>
          </Surface>

          <AnimatePresence>
            {selectedNonprofit && activeTab === 'matches' ? (
              <MotionDiv
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Surface strong className="relative overflow-hidden px-6 py-6 sm:px-8">
                  <div className="relative flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow mb-3">Selected organization</p>
                        <h3 className="font-cta text-3xl text-forest">{selectedNonprofit.name}</h3>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge tone="grove">{selectedNonprofit.sector}</Badge>
                          <Badge tone="sky">{selectedNonprofit.maturity}</Badge>
                          <Badge>{selectedNonprofit.location}</Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedNonprofit(null)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-forest/10 bg-white/70 text-forest transition hover:bg-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="body-copy border-l-2 border-sun pl-4 text-lg">
                      {selectedNonprofit.mission}
                    </p>

                    <div className="rounded-[1.6rem] bg-forest px-5 py-5 text-cream shadow-lift">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-sun" />
                        <p className="font-cta text-sm text-cream/82">AI explanation</p>
                      </div>
                      <p className="text-sm leading-7 text-cream/90">
                        {loadingExplain ? 'Analyzing the overlap between your priorities and this organization’s profile...' : explanation || 'Request an explanation to see why this organization rises for the current weighting.'}
                      </p>

                      <div className="mt-6">
                        <div className="mb-4">
                          <div>
                            <p className="font-cta text-sm uppercase tracking-[0.18em] text-cream/74">Human evaluation reminders</p>
                            <p className="mt-2 text-sm leading-6 text-cream/78">
                              Use these checkpoints as a quick due-diligence reminder before approving the organization for outreach.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {dueDiligenceSteps.map((step, index) => {
                            const source = step.getSource(selectedNonprofit)

                            return (
                              <div
                                key={step.key}
                                className="rounded-[1.35rem] border border-white/12 bg-white/6 px-4 py-4 transition"
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="max-w-3xl">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-cream">
                                        {index + 1}
                                      </div>
                                      <h4 className="font-cta text-lg text-cream">{step.title}</h4>
                                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-cream/74">
                                        Recommended review
                                      </span>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-cream/82">{step.description}</p>
                                  </div>

                                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                                    <a
                                      href={source.href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="brand-button-secondary border-sun/35 bg-sun/18 px-4 py-2 text-cream hover:border-sun/55 hover:bg-sun/32 hover:text-cream"
                                    >
                                      {source.label}
                                      <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Button onClick={() => handleApprove(selectedNonprofit)} className="bg-sun text-forest hover:bg-[#e7b22f]">
                          Approve for outreach
                        </Button>
                        <p className="self-center text-sm text-cream/74">
                          Review these reminders as needed, then approve when you’re comfortable moving forward.
                        </p>
                      </div>
                    </div>
                  </div>
                </Surface>
              </MotionDiv>
            ) : null}
          </AnimatePresence>

          {activeTab === 'matches' ? (
            <Surface className="px-5 py-5 sm:px-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow mb-2">Top matches</p>
                  <h3 className="font-cta text-2xl text-forest">Organizations worth a closer look</h3>
                </div>
                <Badge tone="sun">{filteredMatches.length} available</Badge>
              </div>

              <div className="space-y-4">
                {filteredMatches.length === 0 ? (
                  <EmptyState
                    icon={<Trees className="h-7 w-7" />}
                    title="No new organizations match this lens"
                    body="Try widening the sector, adjusting maturity, or easing one or two weight sliders to reopen the field."
                  />
                ) : (
                  filteredMatches.map((org) => (
                    <MotionButton
                      key={org.id}
                      layout
                      onClick={() => handleExplain(org)}
                      className={[
                        'w-full rounded-[1.75rem] border px-5 py-5 text-left transition sm:px-6',
                        selectedNonprofit?.id === org.id
                          ? 'border-pine bg-pine/8 shadow-lift'
                          : 'border-forest/8 bg-white/72 hover:-translate-y-0.5 hover:border-pine/28 hover:bg-white',
                      ].join(' ')}
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-cta text-2xl text-forest">{org.name}</h4>
                            <Badge tone="grove">{org.sector}</Badge>
                          </div>
                          <p className="body-copy mt-3">{org.mission}</p>
                          {org.enrichment_summary ? (
                            <p className="mt-4 rounded-2xl border border-grove/15 bg-grove/6 px-4 py-3 text-sm leading-6 text-pine">
                              <span className="font-cta">AI insight:</span> {org.enrichment_summary}
                            </p>
                          ) : null}
                        </div>

                        <div className="min-w-[210px] rounded-[1.5rem] bg-forest px-5 py-4 text-cream lg:max-w-[240px]">
                          <p className="eyebrow mb-3 text-cream/70">Match score</p>
                          <div className="mb-3 flex items-end gap-2">
                            <span className="font-cta text-4xl">{org.score}</span>
                            <span className="pb-1 text-sm text-cream/70">/100</span>
                          </div>
                          <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-white/12">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${org.score}%` }}
                              transition={{ duration: 0.65, ease: 'easeOut' }}
                              className="h-full rounded-full bg-[linear-gradient(90deg,#f4c146,#2d915f)]"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-cream/76">
                            <MapPin className="h-4 w-4" />
                            {org.location}
                          </div>
                          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sun">
                            Review details <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </MotionButton>
                  ))
                )}
              </div>
            </Surface>
          ) : (
            <Surface className="px-5 py-5 sm:px-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow mb-2">Saved shortlist</p>
                  <h3 className="font-cta text-2xl text-forest">Approved organizations for outreach</h3>
                </div>
                <Badge tone="sky">{savedNonprofits.length} approved</Badge>
              </div>

              <div className="space-y-4">
                {savedNonprofits.length === 0 ? (
                  <EmptyState
                    icon={<Check className="h-7 w-7" />}
                    title="Your shortlist is still open"
                    body="Approve organizations from the discovery view to build an outreach-ready set of partners here."
                  />
                ) : (
                  savedNonprofits.map((org) => (
                    <MotionDiv key={org.nonprofit_id} layout className="rounded-[1.85rem] border border-forest/8 bg-white/76 px-5 py-5 shadow-soft sm:px-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                        <div className="max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-cta text-2xl text-forest">{org.name}</h4>
                            <Badge tone="grove">{org.sector}</Badge>
                          </div>
                          <p className="body-copy mt-3">{org.mission}</p>
                          {org.enrichment_summary ? (
                            <p className="mt-4 rounded-2xl border border-sky/20 bg-sky/8 px-4 py-3 text-sm leading-6 text-forest/80">
                              <span className="font-cta">AI insight:</span> {org.enrichment_summary}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-3">
                          <Button variant="secondary" onClick={(event) => handleRemove(org.nonprofit_id, org.name, event)}>
                            Remove from shortlist
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {metricFields.map(([key, label]) => (
                          <div key={key} className="rounded-[1.4rem] border border-forest/8 bg-cream/68 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/50">{label}</p>
                            <p className="mt-3 font-cta text-3xl text-forest">
                              {org[key] != null ? `${(org[key] * 50).toFixed(0)}` : '—'}
                            </p>
                            <p className="text-xs text-forest/48">out of 100</p>
                          </div>
                        ))}
                      </div>
                    </MotionDiv>
                  ))
                )}
              </div>
            </Surface>
          )}
        </div>
      </section>

      <AnimatePresence>
        {toast ? (
          <MotionDiv
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-5 right-5 z-50 max-w-sm rounded-[1.4rem] border border-forest/10 bg-white px-5 py-4 shadow-lift"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-2.5 w-2.5 rounded-full ${toast.kind === 'error' ? 'bg-ember' : 'bg-grove'}`} />
              <div>
                <p className="font-cta text-sm text-forest">{toast.kind === 'error' ? 'Something needs attention' : 'Shortlist updated'}</p>
                <p className="mt-1 text-sm leading-6 text-forest/72">{toast.message}</p>
              </div>
            </div>
          </MotionDiv>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
