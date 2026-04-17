import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ClipboardCopy,
  Download,
  Eye,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Send,
  X,
} from 'lucide-react'
import { Badge } from '../components/ui'

const MotionDiv = motion.div
const MotionTextarea = motion.textarea

// ─── press-kit field config (drives PDF, not email) ─────────────────────────
const KIT_FIELDS = [
  {
    key: 'aboutHeadline',
    label: 'One-Page Headline',
    hint: 'Bold title that opens the PDF packet.',
    maxLen: 120,
    rows: 2,
  },
  {
    key: 'aboutBgt',
    label: 'About Big Green Tent',
    hint: 'Introduce who Big Green Tent is and what we do.',
    maxLen: 700,
    rows: 5,
  },
  {
    key: 'methodology',
    label: 'Our Methodology',
    hint: 'Explain the review process — scoring, vetting, human checks.',
    maxLen: 700,
    rows: 5,
  },
  {
    key: 'whySelected',
    label: 'Why We Selected This Organization',
    hint: 'Specific reasons this org stood out in our review.',
    maxLen: 700,
    rows: 5,
  },
  {
    key: 'offer',
    label: 'What We Offer as a Partner',
    hint: 'The value Big Green Tent brings to partner organizations.',
    maxLen: 600,
    rows: 5,
  },
  {
    key: 'nextSteps',
    label: 'Suggested Next Steps',
    hint: 'What the org can do to move the conversation forward.',
    maxLen: 400,
    rows: 3,
  },
]

const METRIC_FIELDS = [
  ['program_efficiency', 'Efficiency'],
  ['revenue_growth', 'Growth'],
  ['sustainability', 'Sustainability'],
  ['scale', 'Scale'],
  ['grant_distribution', 'Grant Reach'],
  ['geographic_reach', 'Footprint'],
  ['innovation_output', 'Innovation'],
]

// ─── helpers ─────────────────────────────────────────────────────────────────
function slugForEmail(name) {
  return (name || 'organization')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 30) || 'organization'
}

function initKit(org) {
  const enrichment = org.enrichment_summary ? ` ${org.enrichment_summary}` : ''
  return {
    aboutHeadline: `Big Green Tent × ${org.name}`,
    aboutBgt: `Big Green Tent is a reviewer workspace for institutional donors focused on the environmental sector. We curate, vet, and coordinate shortlists of high-trust nonprofits working on climate, conservation, and community impact.`,
    methodology: `Every organization in our pipeline is evaluated on seven metrics: program efficiency, revenue growth, sustainability, scale, grant distribution, geographic reach, and innovation output. Each profile is also reviewed by at least one human reviewer before being recommended to our donor network.`,
    whySelected: `${org.name} was shortlisted for its alignment with our environmental focus and the strength of its mission in ${org.sector}.${enrichment}`,
    offer: `Partner organizations gain visibility inside our donor coordination workflow, access to donor introductions prepared by vetted reviewers, and periodic impact syntheses that help reviewers contextualize your work for funders.`,
    nextSteps: `Share your most recent annual report, any program updates, and a preferred point of contact for ongoing coordination. We would welcome a short introductory call to discuss possible alignment.`,
  }
}

function buildEmail(org) {
  const slug = slugForEmail(org.name)
  return {
    to: `partnerships@${slug}.org`,
    recipient: `Partnerships or Development Contact, ${org.name}`,
    subject: `Big Green Tent Outreach: Introduction to ${org.name}`,
    body: [
      `Hello ${org.name} team,`,
      '',
      `I'm reaching out from Big Green Tent. Our reviewer group recently shortlisted your organization because of its alignment with our environmental focus and the strength of your mission in ${org.sector}.`,
      '',
      `We are preparing the next round of outreach to organizations that stood out in our internal review workflow. Your work appears especially relevant for donors looking for high-trust, community-grounded environmental impact.`,
      '',
      `We would love to schedule a short introductory conversation and request your current outreach materials, giving information, and any recent program updates you would like to share with our internal reviewers.`,
      '',
      `Warm regards,`,
      `[Your Name]`,
      `Big Green Tent Reviewer Workspace`,
    ].join('\n'),
  }
}

function buildPlainEmail(email) {
  return [
    `To: ${email.to}`,
    `Recipient: ${email.recipient}`,
    `Subject: ${email.subject}`,
    '',
    email.body,
    '',
    '---',
    'Sent via Big Green Tent Reviewer Workspace',
  ].join('\n')
}

// ─── press-kit PDF (brand-kit aligned editorial layout) ─────────────────────
const BRAND = {
  forest: '#0D3023',
  pine: '#157151',
  grove: '#2D915F',
  canvas: '#F9F6EF',
  sand: '#C1AE92',
  soil: '#3F291E',
  sun: '#F4C148',
  sky: '#4FA2DB',
  ember: '#ED5632',
}

const SERIF = '"GT Alpina Condensed Light", "Cormorant Garamond", "Iowan Old Style", Baskerville, "Times New Roman", Georgia, serif'
const SERIF_ITALIC = '"GT Alpina Condensed Light Italic", "Cormorant Garamond", "Iowan Old Style", Georgia, serif'
const SANS = '"Articulat CF Regular", "Avenir Next", system-ui, -apple-system, "Segoe UI", Arial, sans-serif'
const SANS_BOLD = '"Articulat CF Bold", "Avenir Next Demi Bold", "Avenir Next", system-ui, sans-serif'

function PressKitDocument({ org, kit, forPrint = false }) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const metrics = [
    ['program_efficiency', 'Efficiency', BRAND.grove],
    ['revenue_growth', 'Growth', BRAND.pine],
    ['sustainability', 'Sustainability', BRAND.forest],
    ['scale', 'Scale', BRAND.sky],
    ['grant_distribution', 'Grant Reach', BRAND.sun],
    ['geographic_reach', 'Footprint', BRAND.ember],
    ['innovation_output', 'Innovation', BRAND.grove],
  ]

  const eyebrowStyle = {
    fontFamily: SANS_BOLD,
    fontSize: '9pt',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: BRAND.pine,
  }

  const bodyStyle = {
    fontFamily: SANS,
    fontSize: '10.5pt',
    lineHeight: 1.7,
    color: BRAND.soil,
    whiteSpace: 'pre-wrap',
  }

  const serifHeadline = {
    fontFamily: SERIF,
    fontWeight: 300,
    letterSpacing: '-0.01em',
    color: BRAND.forest,
  }

  return (
    <div
      id={forPrint ? 'bgt-print-area' : undefined}
      aria-hidden={forPrint ? 'true' : undefined}
      style={{
        fontFamily: SANS,
        color: BRAND.soil,
        background: BRAND.canvas,
        width: '100%',
        maxWidth: '740px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Page header strip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 44px 18px',
          borderBottom: `1px solid ${BRAND.forest}18`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/brand/BGT-Tent_Icon_Forest.svg"
            alt=""
            style={{ width: '26px', height: '26px' }}
          />
          <span style={{ ...eyebrowStyle, color: BRAND.forest, fontSize: '8.5pt' }}>
            Big Green Tent · Outreach Packet
          </span>
        </div>
        <span style={{ ...eyebrowStyle, color: BRAND.sand, fontSize: '8pt' }}>
          {date}
        </span>
      </div>

      {/* ── Hero cover ── */}
      <div style={{ position: 'relative', padding: '36px 44px 24px' }}>
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: '24px',
            alignItems: 'stretch',
            minHeight: '280px',
          }}
        >
          {/* Ember block w/ headline */}
          <div
            style={{
              position: 'relative',
              background: BRAND.ember,
              borderRadius: '8px',
              padding: '28px 26px',
              color: '#fff',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
            }}
          >
            {/* Sun circle accent (top-right) */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: BRAND.sun,
              }}
              aria-hidden="true"
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ ...eyebrowStyle, color: '#fff', opacity: 0.82, margin: 0 }}>
                Contact Package
              </p>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1
                style={{
                  ...serifHeadline,
                  color: '#fff',
                  fontSize: '30pt',
                  lineHeight: 1.02,
                  margin: 0,
                }}
              >
                {kit.aboutHeadline}
              </h1>
              <p
                style={{
                  fontFamily: SERIF_ITALIC,
                  fontStyle: 'italic',
                  fontSize: '13pt',
                  color: '#fff',
                  opacity: 0.92,
                  margin: '10px 0 0',
                }}
              >
                Built for people, by people.
              </p>
            </div>
          </div>

          {/* Photo with organic frame */}
          <div
            style={{
              position: 'relative',
              background: BRAND.forest,
              borderRadius: '8px',
              overflow: 'hidden',
              minHeight: '280px',
              backgroundImage: `linear-gradient(160deg, ${BRAND.forest}d9, ${BRAND.pine}b8), url('/brand/TENT_HEADER-Forest.png')`,
              backgroundSize: 'cover, cover',
              backgroundPosition: 'center, center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <img
              src="/brand/BGT_OrganicFrame-1_Grove.png"
              alt=""
              style={{
                position: 'absolute',
                bottom: '-20px',
                right: '-30px',
                width: '220px',
                opacity: 0.55,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '22px',
                bottom: '20px',
                color: '#fff',
              }}
            >
              <p style={{ ...eyebrowStyle, color: BRAND.sun, margin: 0, fontSize: '8pt' }}>
                Prepared For
              </p>
              <p
                style={{
                  ...serifHeadline,
                  color: '#fff',
                  fontSize: '22pt',
                  lineHeight: 1,
                  margin: '6px 0 0',
                }}
              >
                {org.name}
              </p>
              {org.location && (
                <p style={{ fontFamily: SANS, fontSize: '9pt', color: '#ffffffcc', margin: '6px 0 0' }}>
                  {org.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Meta strip */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '18px',
          }}
        >
          <span
            style={{
              padding: '5px 12px',
              background: `${BRAND.grove}1c`,
              color: BRAND.pine,
              borderRadius: '999px',
              fontFamily: SANS_BOLD,
              fontSize: '8.5pt',
              letterSpacing: '0.08em',
            }}
          >
            {org.sector}
          </span>
          {org.maturity && (
            <span
              style={{
                padding: '5px 12px',
                background: `${BRAND.sand}38`,
                color: BRAND.soil,
                borderRadius: '999px',
                fontFamily: SANS_BOLD,
                fontSize: '8.5pt',
                letterSpacing: '0.08em',
              }}
            >
              {org.maturity}
            </span>
          )}
        </div>
      </div>

      {/* ── Section: About Big Green Tent ── */}
      <section style={{ padding: '28px 44px', pageBreakInside: 'avoid' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px' }}>
          <div>
            <p style={{ ...eyebrowStyle, margin: 0 }}>About</p>
            <h2 style={{ ...serifHeadline, fontSize: '22pt', lineHeight: 1.05, margin: '10px 0 0' }}>
              Where Reviewers And Purpose Gather
            </h2>
            <img
              src="/brand/Asset 19.svg"
              alt=""
              style={{ display: 'block', marginTop: '14px', width: '90px', opacity: 0.85 }}
            />
          </div>
          <div>
            <p style={{ ...bodyStyle, margin: 0 }}>{kit.aboutBgt}</p>
          </div>
        </div>
      </section>

      {/* ── Pull quote divider (italic serif, grove underline) ── */}
      <div
        style={{
          background: `${BRAND.sand}26`,
          padding: '30px 44px',
          margin: '0',
          borderTop: `1px solid ${BRAND.forest}10`,
          borderBottom: `1px solid ${BRAND.forest}10`,
        }}
      >
        <p
          style={{
            fontFamily: SERIF_ITALIC,
            fontStyle: 'italic',
            fontSize: '20pt',
            lineHeight: 1.25,
            color: BRAND.forest,
            margin: 0,
            textAlign: 'center',
          }}
        >
          &ldquo;Growth is a collective act.&rdquo;
        </p>
        <div
          style={{
            width: '140px',
            height: '2px',
            background: BRAND.grove,
            margin: '14px auto 0',
            borderRadius: '2px',
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── Section: Methodology ── */}
      <section style={{ padding: '32px 44px', pageBreakInside: 'avoid' }}>
        <p style={{ ...eyebrowStyle, margin: 0 }}>Our Methodology</p>
        <h2 style={{ ...serifHeadline, fontSize: '22pt', lineHeight: 1.05, margin: '8px 0 16px' }}>
          Seven Signals, One Human Review
        </h2>
        <p style={{ ...bodyStyle, marginTop: 0 }}>{kit.methodology}</p>

        {/* Metric chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px',
            marginTop: '18px',
          }}
        >
          {metrics.map(([key, label, accent]) => {
            const score = org[key] != null ? Math.round(org[key] * 50) : null
            return (
              <div
                key={key}
                style={{
                  borderTop: `3px solid ${accent}`,
                  background: '#fff',
                  padding: '10px 8px',
                  borderRadius: '0 0 6px 6px',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: SANS_BOLD,
                    fontSize: '7pt',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: BRAND.soil,
                    margin: 0,
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    ...serifHeadline,
                    fontSize: '16pt',
                    margin: '4px 0 0',
                  }}
                >
                  {score ?? '—'}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section: Why We Selected (feature band) ── */}
      <section
        style={{
          background: BRAND.forest,
          color: '#fff',
          padding: '32px 44px',
          position: 'relative',
          pageBreakInside: 'avoid',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '120px',
            height: '120px',
            background: BRAND.sun,
            borderRadius: '0 0 0 120px',
            opacity: 0.95,
          }}
          aria-hidden="true"
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '560px' }}>
          <p style={{ ...eyebrowStyle, color: BRAND.sun, margin: 0 }}>Why We Selected</p>
          <h2
            style={{
              ...serifHeadline,
              color: '#fff',
              fontSize: '24pt',
              lineHeight: 1.05,
              margin: '8px 0 14px',
            }}
          >
            {org.name}
          </h2>
          <p style={{ ...bodyStyle, color: '#ffffffe6', margin: 0 }}>{kit.whySelected}</p>
          {org.mission && (
            <p
              style={{
                fontFamily: SERIF_ITALIC,
                fontStyle: 'italic',
                fontSize: '12pt',
                lineHeight: 1.5,
                color: '#ffffffcc',
                marginTop: '18px',
                paddingLeft: '14px',
                borderLeft: `3px solid ${BRAND.sun}`,
              }}
            >
              &ldquo;{org.mission}&rdquo;
            </p>
          )}
        </div>
      </section>

      {/* ── Section: What We Offer (three cards) ── */}
      <section style={{ padding: '32px 44px', pageBreakInside: 'avoid' }}>
        <p style={{ ...eyebrowStyle, margin: 0 }}>What We Offer</p>
        <h2 style={{ ...serifHeadline, fontSize: '22pt', lineHeight: 1.05, margin: '8px 0 16px' }}>
          A Partnership Built On Trust
        </h2>
        <p style={{ ...bodyStyle, marginTop: 0, marginBottom: '20px' }}>{kit.offer}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { tint: BRAND.sun, label: 'Donor Visibility', copy: 'Surface inside our donor-facing coordination workflow.' },
            { tint: BRAND.grove, label: 'Warm Introductions', copy: 'Introductions prepared by vetted reviewers, not cold outreach.' },
            { tint: BRAND.sky, label: 'Impact Syntheses', copy: 'Periodic briefings that help funders contextualize your work.' },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: '#fff',
                borderRadius: '10px',
                padding: '16px 14px',
                borderTop: `4px solid ${c.tint}`,
              }}
            >
              <p
                style={{
                  fontFamily: SANS_BOLD,
                  fontSize: '10pt',
                  color: BRAND.forest,
                  margin: 0,
                }}
              >
                {c.label}
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: '9.5pt',
                  lineHeight: 1.55,
                  color: BRAND.soil,
                  margin: '6px 0 0',
                }}
              >
                {c.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Next Steps + CTA ── */}
      <section
        style={{
          padding: '32px 44px 20px',
          background: `${BRAND.sand}2e`,
          pageBreakInside: 'avoid',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'center' }}>
          <div>
            <p style={{ ...eyebrowStyle, margin: 0 }}>Suggested Next Steps</p>
            <h2 style={{ ...serifHeadline, fontSize: '22pt', lineHeight: 1.05, margin: '8px 0 14px' }}>
              Let&rsquo;s Grow Together
            </h2>
            <p style={{ ...bodyStyle, margin: 0 }}>{kit.nextSteps}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '12px 22px',
                background: BRAND.forest,
                color: '#fff',
                borderRadius: '999px',
                fontFamily: SANS_BOLD,
                fontSize: '10pt',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderBottom: `3px solid ${BRAND.ember}`,
              }}
            >
              Reply To Begin
            </div>
            <p
              style={{
                fontFamily: SERIF_ITALIC,
                fontStyle: 'italic',
                fontSize: '11pt',
                color: BRAND.forest,
                margin: '14px 0 0',
              }}
            >
              Community · Care · Action
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          background: BRAND.forest,
          color: BRAND.canvas,
          padding: '22px 44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/brand/BGT-Tent_Icon_Forest.svg"
            alt=""
            style={{ width: '28px', height: '28px', filter: 'brightness(0) invert(1)' }}
          />
          <div>
            <p style={{ ...eyebrowStyle, color: BRAND.sun, fontSize: '8pt', margin: 0 }}>
              Big Green Tent
            </p>
            <p style={{ fontFamily: SANS, fontSize: '8.5pt', color: '#ffffffb3', margin: '3px 0 0' }}>
              Reviewer Workspace · biggreentent.org
            </p>
          </div>
        </div>
        <p style={{ fontFamily: SANS, fontSize: '8pt', color: '#ffffff80', margin: 0 }}>
          Please review and personalize before sharing.
        </p>
      </footer>
    </div>
  )
}

// ─── PDF preview modal ────────────────────────────────────────────────────────
function PdfPreviewModal({ open, onClose, onExport, org, kit }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-preview-heading"
          onClick={onClose}
        >
          <MotionDiv
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto my-6 flex w-full max-w-[900px] flex-1 flex-col overflow-hidden rounded-[1.5rem] bg-cream shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-forest/10 bg-white/80 px-6 py-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-forest/70" aria-hidden="true" />
                <h2 id="pdf-preview-heading" className="font-cta text-base text-forest">
                  PDF Preview
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:bg-forest hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky"
                >
                  Cancel
                </button>
                <button
                  onClick={onExport}
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream transition hover:bg-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export as PDF
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close preview"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-forest/15 bg-white text-forest transition hover:bg-forest hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#3F291E] px-6 py-8">
              <div className="mx-auto max-w-[740px] overflow-hidden rounded-[0.5rem] shadow-2xl ring-1 ring-black/20">
                <PressKitDocument org={org} kit={kit} />
              </div>
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function PersonalizePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const org = location.state?.org

  const [kit, setKit] = useState(() => (org ? initKit(org) : null))
  const [regen, setRegen] = useState({})
  const [regenAll, setRegenAll] = useState(false)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const copyTimer = useRef(null)
  const anyBusy = regenAll || Object.values(regen).some(Boolean)

  const email = useMemo(() => (org ? buildEmail(org) : null), [org])

  useEffect(() => {
    if (!org) navigate('/admin', { replace: true })
  }, [org, navigate])

  function announce(msg) {
    setStatus(msg)
    setTimeout(() => setStatus(''), 4500)
  }

  const setField = useCallback((key, val) => {
    setKit((prev) => ({ ...prev, [key]: val }))
  }, [])

  async function regenerate(key) {
    setRegen((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch('/api/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org, field: key }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setField(key, data.text)
      announce(`${KIT_FIELDS.find((f) => f.key === key)?.label} regenerated.`)
    } catch (err) {
      announce(`Regeneration failed: ${err.message}`)
    } finally {
      setRegen((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function regenerateAll() {
    setRegenAll(true)
    for (const { key } of KIT_FIELDS) {
      await regenerate(key)
    }
    setRegenAll(false)
    announce('All press-kit fields have been regenerated with AI.')
  }

  async function copyEmail() {
    if (!email) return
    const text = buildPlainEmail(email)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = Object.assign(document.createElement('textarea'), {
        value: text,
        style: 'position:fixed;opacity:0',
      })
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    announce('Email template copied to clipboard.')
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 2500)
  }

  function openPreview() {
    setShowPreview(true)
  }

  function exportPDF() {
    setShowPreview(false)
    announce('Opening print dialog — choose "Save as PDF" in your printer options.')
    setTimeout(() => window.print(), 120)
  }

  if (!org || !kit) return null

  return (
    <>
      {/* Skip navigation */}
      <a
        href="#personalize-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-forest focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-cream focus:shadow-lift focus:outline focus:outline-2 focus:outline-sky"
      >
        Skip to Main Content
      </a>

      {/* Live announcement region — screen readers only */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status}
      </div>

      {/* Toast — visual only */}
      <AnimatePresence>
        {status && (
          <MotionDiv
            key={status}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            aria-hidden="true"
            className="fixed bottom-6 right-6 z-50 max-w-xs rounded-[1.2rem] bg-forest px-5 py-3 text-sm font-semibold text-cream shadow-lift"
          >
            {status}
          </MotionDiv>
        )}
      </AnimatePresence>

      <main id="personalize-main" className="flex flex-col gap-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 rounded-full border border-forest/12 bg-white/70 px-4 py-2 text-sm font-semibold text-forest transition hover:bg-forest hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Outreach Dashboard
              </button>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-forest/40" />
            </li>
            <li
              aria-current="page"
              className="max-w-[14rem] truncate text-sm font-semibold text-forest/70"
            >
              {org.name}
            </li>
          </ol>
        </nav>

        {/* Hero header with org details */}
        <section
          aria-label={`Editing outreach package for ${org.name}`}
          className="brand-card-strong relative overflow-hidden px-6 py-7 sm:px-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow mb-2">Contact Package Editor</p>
              <h1 className="font-display text-4xl text-forest sm:text-5xl">
                {org.name}
              </h1>
              <p className="body-copy mt-3">{org.mission}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone="grove">{org.sector}</Badge>
                {org.maturity && <Badge>{org.maturity}</Badge>}
                {org.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/10 bg-white/70 px-3 py-1 text-xs font-semibold text-forest/80">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {org.location}
                  </span>
                )}
              </div>
            </div>

            <div
              className="flex shrink-0 items-center gap-2 self-start rounded-[1.25rem] border border-sun/30 bg-sun/12 px-4 py-3"
              role="status"
              aria-label="Draft in progress"
            >
              <FileText className="h-4 w-4 text-forest/60" aria-hidden="true" />
              <span className="text-sm font-semibold text-forest">Draft In Progress</span>
            </div>
          </div>

          {/* Enrichment summary if present */}
          {org.enrichment_summary && (
            <div className="mt-5 rounded-[1.25rem] border border-grove/15 bg-grove/5 px-4 py-3">
              <p className="eyebrow mb-1 text-[0.65rem]">Reviewer Insight</p>
              <p className="text-sm leading-6 text-forest/80">{org.enrichment_summary}</p>
            </div>
          )}

          {/* Metric grid */}
          <div className="mt-5">
            <p className="eyebrow mb-3">Impact Snapshot</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {METRIC_FIELDS.map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-[1.1rem] border border-forest/8 bg-white/70 px-3 py-3 text-center"
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-forest/50">
                    {label}
                  </p>
                  <p className="mt-1.5 font-cta text-2xl text-forest">
                    {org[key] != null ? `${(org[key] * 50).toFixed(0)}` : '—'}
                  </p>
                  <p className="text-[0.65rem] text-forest/45">Out Of 100</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main two-column layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px]">

          {/* ── Left: editable press-kit fields ── */}
          <section aria-labelledby="editor-heading" className="brand-card px-5 py-6 sm:px-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 id="editor-heading" className="font-cta text-xl text-forest">
                Edit Outreach Fields
              </h2>
              <button
                onClick={regenerateAll}
                disabled={anyBusy}
                aria-busy={regenAll}
                aria-label="Regenerate all press-kit fields using AI"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream transition hover:bg-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky disabled:cursor-not-allowed disabled:opacity-50"
              >
                {regenAll
                  ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Regenerating All…</>
                  : <><RefreshCw className="h-4 w-4" aria-hidden="true" />Regenerate All With AI</>}
              </button>
            </div>
            <p className="mb-5 text-xs leading-relaxed text-forest/55">
              These fields build your one-page PDF press kit introducing Big Green Tent to {org.name}. The email preview on the right is generated separately.
            </p>

            <div className="space-y-5">
              {KIT_FIELDS.map(({ key, label, hint, maxLen, rows }) => {
                const val = kit[key]
                const busy = regen[key] || regenAll
                const nearLimit = val.length > maxLen * 0.85
                const atLimit = val.length >= maxLen

                return (
                  <div
                    key={key}
                    className="rounded-[1.5rem] border border-forest/8 bg-cream/30 px-4 py-4 transition-opacity"
                    style={{ opacity: busy ? 0.6 : 1 }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <label
                          htmlFor={`field-${key}`}
                          className="font-cta text-sm font-semibold text-forest"
                        >
                          {label}
                        </label>
                        <p
                          id={`hint-${key}`}
                          className="mt-0.5 text-xs leading-relaxed text-forest/55"
                        >
                          {hint}
                        </p>
                      </div>

                      <button
                        onClick={() => regenerate(key)}
                        disabled={busy}
                        aria-label={`Regenerate ${label} using AI`}
                        aria-busy={!!regen[key]}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-grove/25 bg-white/80 px-3 py-1.5 text-xs font-semibold text-grove transition hover:border-grove hover:bg-grove hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-grove disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {regen[key]
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /><span>Generating</span></>
                          : <><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /><span>Regenerate</span></>}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      <MotionTextarea
                        key={`${key}-${busy ? 'busy' : 'idle'}`}
                        initial={false}
                        animate={{ opacity: 1 }}
                        id={`field-${key}`}
                        aria-describedby={`hint-${key} count-${key}`}
                        value={val}
                        onChange={(e) => setField(key, e.target.value)}
                        rows={rows}
                        maxLength={maxLen}
                        disabled={busy}
                        className="brand-input w-full resize-y disabled:cursor-wait"
                        style={{ minHeight: `${rows * 1.8}rem` }}
                      />
                    </AnimatePresence>

                    <p
                      id={`count-${key}`}
                      className={`mt-1.5 text-right text-xs transition-colors ${
                        atLimit
                          ? 'font-semibold text-ember'
                          : nearLimit
                          ? 'text-sun'
                          : 'text-forest/35'
                      }`}
                      aria-live="polite"
                      aria-label={`${val.length} of ${maxLen} characters used`}
                    >
                      {val.length} / {maxLen}
                      {atLimit && <span className="ml-1">(Limit Reached)</span>}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Right: actions + preview ── */}
          <div className="flex flex-col gap-4">

            {/* Package actions */}
            <section aria-labelledby="actions-heading" className="brand-card px-5 py-5">
              <h2 id="actions-heading" className="mb-4 font-cta text-lg text-forest">
                Package Actions
              </h2>

              <div className="flex flex-col gap-3" role="group" aria-label="Export and copy actions">
                <button
                  onClick={openPreview}
                  aria-label="Preview the outreach PDF before exporting"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3.5 font-cta text-sm text-cream shadow-soft transition hover:-translate-y-0.5 hover:bg-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Preview PDF
                </button>

                <button
                  onClick={copyEmail}
                  aria-label={copied ? 'Email template copied to clipboard' : 'Copy formatted email template to clipboard'}
                  aria-pressed={copied}
                  className={`flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3.5 font-cta text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky ${
                    copied
                      ? 'border-grove/40 bg-grove/10 text-grove'
                      : 'border-forest/18 bg-white/80 text-forest hover:-translate-y-0.5 hover:bg-forest hover:text-cream'
                  }`}
                >
                  {copied
                    ? <><Check className="h-4 w-4" aria-hidden="true" />Copied To Clipboard</>
                    : <><ClipboardCopy className="h-4 w-4" aria-hidden="true" />Copy Email Template</>}
                </button>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-forest/50">
                <strong className="font-semibold text-forest/70">Preview PDF:</strong> Review the press kit, then export when you're happy with it.{' '}
                <strong className="font-semibold text-forest/70">Copy:</strong> Pastes a plain-text email draft into your email client.
              </p>
            </section>

            {/* Live email preview — auto-generated, not tied to fields */}
            <section
              aria-labelledby="preview-heading"
              className="brand-card px-5 py-5 lg:sticky lg:top-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <Send className="h-4 w-4 text-forest/55" aria-hidden="true" />
                <h2 id="preview-heading" className="font-cta text-lg text-forest">
                  Email Preview
                </h2>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-forest/55">
                Auto-generated from this organization's profile. Copy to your inbox to personalize further.
              </p>

              <div
                className="max-h-[58vh] overflow-y-auto rounded-[1.5rem] bg-forest px-4 py-5 text-sm leading-relaxed"
                role="region"
                aria-label="Live email preview"
                aria-live="off"
                tabIndex={0}
              >
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-sun/80">To</p>
                    <p className="break-words font-mono text-sm text-cream">{email.to}</p>
                    <p className="mt-1 break-words text-xs text-cream/80">{email.recipient}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-sun/80">Subject</p>
                    <p className="font-semibold text-cream">{email.subject}</p>
                  </div>
                  <div className="border-t border-cream/20 pt-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-cream">{email.body}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* PDF preview modal */}
      <PdfPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onExport={exportPDF}
        org={org}
        kit={kit}
      />

      {/* Print area — invisible in browser, visible when window.print() fires */}
      {createPortal(
        <PressKitDocument org={org} kit={kit} forPrint />,
        document.body
      )}
    </>
  )
}
