import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Mail, Send, Sprout, Users, X } from 'lucide-react'
import { Badge, Button, EmptyState, SectionHeading, Surface } from '../components/ui'

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

  return (
    <div className="flex flex-col gap-8">
      <Surface strong className="relative overflow-hidden px-6 py-6 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr),320px] lg:items-end">
          <SectionHeading
            eyebrow="Outreach dashboard"
            title="Manage approved organizations in one internal coordination view"
            accent="Operational next steps"
            body="This route now reads as a task-oriented dashboard for the team, while preserving the existing approved-organization loading and visible actions."
          />

          <div className="brand-card px-5 py-5">
            <p className="eyebrow mb-3">Current snapshot</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-[1.25rem] bg-white/72 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-cream">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-cta text-xl text-forest">{loading ? '...' : approvedOrgs.length}</p>
                  <p className="text-sm text-forest/58">Approved organizations</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.25rem] bg-white/72 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sun text-forest">
                  <Sprout className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-cta text-xl text-forest">Ready</p>
                  <p className="text-sm text-forest/58">For outreach sequencing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="px-5 py-5 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-3">Approved set</p>
            <h2 className="font-cta text-3xl text-forest">
              {loading ? 'Loading outreach list...' : `${approvedOrgs.length} organizations ready to contact`}
            </h2>
          </div>
          <Badge tone="sun">Backend untouched</Badge>
        </div>

        {outreachPackage ? (
          <div className="mb-6 rounded-[1.9rem] border border-forest/10 bg-forest px-5 py-5 text-cream shadow-lift sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-sun" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cream/74">Pre-filled outreach package</p>
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
                    <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Suggested recipient</p>
                    <p className="mt-2 text-sm leading-6 text-cream">{outreachPackage.recipient}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Subject line</p>
                    <p className="mt-2 text-sm leading-6 text-cream">{outreachPackage.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Pre-filled message</p>
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
                  <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Package contents</p>
                  <div className="mt-3 space-y-3 text-sm text-cream/88">
                    <div className="rounded-[1rem] bg-white/8 px-3 py-3">Organization summary from shortlist review</div>
                    <div className="rounded-[1rem] bg-white/8 px-3 py-3">Sector tag: {selectedOrg.sector}</div>
                    <div className="rounded-[1rem] bg-white/8 px-3 py-3">Mission statement for reviewer reference</div>
                    <div className="rounded-[1rem] bg-white/8 px-3 py-3">Suggested intro request and follow-up prompt</div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/12 bg-white/6 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-cream/58">Reviewer action</p>
                  <p className="mt-3 text-sm leading-6 text-cream/82">
                    Review the draft, personalize tone or asks as needed, then copy this into your actual email workflow.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-sun px-4 py-2 text-sm font-semibold text-forest">
                    <Send className="h-4 w-4" />
                    Ready to personalize
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {!loading && approvedOrgs.length === 0 ? (
            <EmptyState
              icon={<Mail className="h-7 w-7" />}
              title="No organizations have been approved yet"
              body="As you approve organizations from the discovery workspace, they will appear here as your first outreach set."
              linkTo="/"
              linkLabel="Return to discovery"
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
                    <span className="stat-pill">Approved for outreach</span>
                    <span className="stat-pill">Discovery shortlisting preserved</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-start lg:justify-end">
                <Button className="min-w-[170px]" onClick={() => setSelectedOrg(org)}>
                  Contact package
                </Button>
              </div>
            </MotionDiv>
          ))}
        </div>
      </Surface>
    </div>
  )
}
