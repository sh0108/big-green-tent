/* global process */
import './tracing.js'
import express from 'express'
import multer from 'multer'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'
import { getDb } from './db.js'
import { seedIfEmpty } from './seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.resolve(process.cwd(), '.env')
dotenv.config({ path: envPath })

seedIfEmpty(getDb())

const apiKey = process.env.OPENAI_QUIZ_API_KEY
if (!apiKey) {
  console.warn('Missing OPENAI_QUIZ_API_KEY in .env')
}

const app = express()
const PORT = Number(process.env.PORT || 8000)
const tmpDir = path.resolve('server', 'tmp')

await fs.mkdir(tmpDir, { recursive: true })

multer({
  dest: tmpDir,
  limits: { fileSize: 10 * 1024 * 1024 },
})

app.use(express.json({ limit: '1mb' }))
app.use(express.static(path.join(__dirname, '../dist')))

const CONFIDENCE_ORDER = { HIGH: 3, MEDIUM: 2, LOW: 1 }
const DEFAULT_SECTOR = 'Water Systems & Marine & Coastal Ecosystems'

function parseMulti(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseRiskSignals(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function geographicReachScore(scope) {
  if (scope === 'National') return 1
  if (scope === 'Regional' || scope === 'State') return 0.7
  if (scope === 'Local') return 0.4
  return 0.55
}

function formatOrg(row) {
  const financialStability = row.scoreFinancialStability
  const revenueHealth = row.scoreRevenueHealth
  const operationalEfficiency = row.scoreOperationalEfficiency
  const organizationalMaturity = row.scoreOrganizationalMaturity
  const missionAlignmentScore = row.missionAlignmentScore

  return {
    ...row,
    id: row.ein,
    inScope: Boolean(row.inScope),
    sector: row.sector || DEFAULT_SECTOR,
    maturity: row.maturityTier,
    mission: row.missionSummary || row.missionStatement,
    location: row.state || null,
    enrichment_summary: row.capacityNarrative || row.notableSignals || null,
    program_efficiency: operationalEfficiency != null ? operationalEfficiency / 100 : null,
    revenue_growth: revenueHealth != null ? revenueHealth / 100 : null,
    sustainability: financialStability != null ? financialStability / 100 : null,
    scale: organizationalMaturity != null ? organizationalMaturity / 100 : null,
    grant_distribution: row.scoreOverall != null ? row.scoreOverall / 100 : null,
    geographic_reach: geographicReachScore(row.geographicScope),
    innovation_output: missionAlignmentScore != null ? missionAlignmentScore / 5 : null,
    riskSignals: parseRiskSignals(row.riskSignals),
    rawMetrics: {
      filingContinuityRaw: row.filingContinuityRaw,
      filingContinuityAdjusted: row.filingContinuityAdjusted,
      filingContinuityAdjustedNote: row.filingContinuityAdjustedNote,
      currentRevenue: row.currentRevenue,
      yearsActive: row.yearsActive,
      boardSize: row.boardSize,
      latestEmployees: row.latestEmployees,
    },
    scores: {
      overallScore: row.scoreOverall,
      financialStability: {
        score: financialStability,
        color: row.colorFinancialStability,
      },
      revenueHealth: {
        score: revenueHealth,
        color: row.colorRevenueHealth,
      },
      operationalEfficiency: {
        score: operationalEfficiency,
        color: row.colorOperationalEfficiency,
      },
      organizationalMaturity: {
        score: organizationalMaturity,
        color: row.colorOrganizationalMaturity,
      },
    },
  }
}

function applyOrgFilters(rows, query, options = {}) {
  const {
    ignoreMinScore = false,
    defaultSector = DEFAULT_SECTOR,
  } = options

  const state = query.state ? String(query.state).trim() : null
  const maturityTier = query.maturityTier ? String(query.maturityTier).trim() : null
  const confidenceBand = query.confidenceBand ? String(query.confidenceBand).trim() : 'ALL'
  const sector = query.sector ? String(query.sector).trim() : defaultSector
  const minMissionAlignment = Number(query.minMissionAlignment || 1)
  const minScore = Number(query.minScore || 0)
  const programFocus = parseMulti(query.programFocus)
  const websiteMissionMatch = parseMulti(query.websiteMissionMatch)

  return rows.filter((row) => {
    if (state && state !== 'ALL' && row.state !== state) return false
    if (maturityTier && maturityTier !== 'All' && maturityTier !== 'ALL' && row.maturityTier !== maturityTier) return false
    if (sector && sector !== 'All sectors' && sector !== 'ALL' && row.sector !== sector) return false
    if ((row.missionAlignmentScore || 0) < minMissionAlignment) return false
    if (!ignoreMinScore && (row.scoreOverall || 0) < minScore) return false

    if (programFocus.length && !programFocus.includes(row.programFocus || '')) return false

    if (websiteMissionMatch.length) {
      const value = row.websiteMissionMatch || 'Not available'
      if (!websiteMissionMatch.includes(value)) return false
    }

    if (confidenceBand === 'HIGH_MEDIUM' && !['HIGH', 'MEDIUM'].includes(row.confidenceBand)) return false
    if (confidenceBand === 'HIGH_ONLY' && row.confidenceBand !== 'HIGH') return false

    return true
  })
}

function sortMainOrgs(rows) {
  return [...rows].sort((a, b) => {
    const scoreDelta = (b.scoreOverall || 0) - (a.scoreOverall || 0)
    if (scoreDelta) return scoreDelta
    return (b.missionAlignmentScore || 0) - (a.missionAlignmentScore || 0)
  })
}

function sortManualOrgs(rows) {
  return [...rows].sort((a, b) => {
    const alignmentDelta = (b.missionAlignmentScore || 0) - (a.missionAlignmentScore || 0)
    if (alignmentDelta) return alignmentDelta
    return (CONFIDENCE_ORDER[b.confidenceBand] || 0) - (CONFIDENCE_ORDER[a.confidenceBand] || 0)
  })
}

function getOrgRows(inScope) {
  const db = getDb()
  return db.prepare('SELECT * FROM organizations WHERE inScope = ?').all(inScope ? 1 : 0)
}

function getAllStateCounts() {
  const db = getDb()
  const rows = db
    .prepare('SELECT state, COUNT(*) as count FROM organizations WHERE inScope = 1 GROUP BY state ORDER BY count DESC, state ASC')
    .all()
  return rows
}

app.get('/healthz', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/orgs', (req, res) => {
  try {
    const rows = getOrgRows(true)
    const filtered = sortMainOrgs(applyOrgFilters(rows, req.query)).map(formatOrg)
    res.json(filtered)
  } catch (err) {
    console.error('Fetch orgs error:', err)
    res.status(500).json({ error: 'Failed to fetch organizations.' })
  }
})

app.get('/api/orgs/manual', (req, res) => {
  try {
    const rows = getOrgRows(false)
    const filtered = sortManualOrgs(applyOrgFilters(rows, req.query, { ignoreMinScore: true })).map(formatOrg)
    res.json(filtered)
  } catch (err) {
    console.error('Fetch manual orgs error:', err)
    res.status(500).json({ error: 'Failed to fetch manual review organizations.' })
  }
})

app.get('/api/orgs/stats', (req, res) => {
  try {
    const rows = sortMainOrgs(applyOrgFilters(getOrgRows(true), req.query))
    const count = rows.length
    const avgScore = count
      ? Math.round(rows.reduce((sum, row) => sum + (row.scoreOverall || 0), 0) / count)
      : null
    const topMatch = rows[0]

    res.json({
      count,
      avgScore,
      topSector: {
        name: DEFAULT_SECTOR,
        count,
      },
      topMatch: topMatch
        ? {
            ein: topMatch.ein,
            name: topMatch.name,
            score: topMatch.scoreOverall,
          }
        : null,
      stateCounts: getAllStateCounts(),
    })
  } catch (err) {
    console.error('Fetch org stats error:', err)
    res.status(500).json({ error: 'Failed to fetch organization stats.' })
  }
})

app.get('/api/orgs/:ein', (req, res) => {
  try {
    const row = getDb().prepare('SELECT * FROM organizations WHERE ein = ?').get(req.params.ein)
    if (!row) {
      return res.status(404).json({ error: 'Organization not found.' })
    }
    res.json(formatOrg(row))
  } catch (err) {
    console.error('Fetch org by EIN error:', err)
    res.status(500).json({ error: 'Failed to fetch organization.' })
  }
})

app.post('/api/explain', async (req, res) => {
  const { nonprofit, weights } = req.body || {}

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_QUIZ_API_KEY in .env.' })
  }

  try {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are the Big Green Tent AI. Explain why this organization scored highly based strictly on the active reviewer weights and the organization data. Start exactly with "This organization ranks highly due to..." and keep it under 45 words.',
        },
        {
          role: 'user',
          content: `Organization data: ${JSON.stringify(nonprofit)}\nActive weights: ${JSON.stringify(weights)}`,
        },
      ],
      temperature: 0.7,
    })

    const reply = response.choices?.[0]?.message?.content
    if (!reply) {
      throw new Error('Empty chat response.')
    }

    res.json({ explanation: reply })
  } catch (error) {
    console.error('Explain error:', error)
    res.status(500).json({ error: error.message || 'Explain failed.' })
  }
})

app.post('/api/generate-outreach', async (req, res) => {
  const { org, field } = req.body || {}

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_QUIZ_API_KEY — add it to your .env to enable AI regeneration.' })
  }

  const prompts = {
    recipient: `Suggest one specific recipient for a cold outreach email to ${org.name}, a ${org.maturityTier || ''} environmental nonprofit in the ${org.sector} sector. Return a single line like "Director of Partnerships at [org name]". No extra text.`,
    subject: `Write a professional, warm email subject line for an introduction from Big Green Tent to ${org.name} (${org.sector} sector). Keep it under 10 words. Return only the subject line, no quotes.`,
    opening: `Write the opening paragraph of a warm, professional outreach email from Big Green Tent to the ${org.name} team. Context: "${org.missionSummary || org.missionStatement || ''}". Sector: ${org.sector}. Start with a greeting, then explain the shortlisting and mission alignment. 3–4 sentences. No subject line.`,
    context: `Write a context paragraph for a donor outreach email to ${org.name} (${org.sector}). Explain that Big Green Tent is preparing its next round of donor introductions and this org was selected for its environmental impact. 2–3 sentences.`,
    ask: `Write a direct, warm ask paragraph for an outreach email to ${org.name}. Request a short introductory call and any current giving information or program updates. 2–3 sentences. No sign-off.`,
    closing: `Write a warm, professional email closing for an outreach from Big Green Tent to ${org.name}. Include a brief encouraging line, then a sign-off placeholder like "[Your name] / Big Green Tent Reviewer Workspace". 2–3 lines total.`,
    aboutHeadline: `Write a short, bold headline (under 12 words) for a one-page PDF introducing Big Green Tent to ${org.name}. It should feel like a press-kit title. Return the headline only, no quotes.`,
    aboutBgt: `Write a 3–4 sentence paragraph introducing Big Green Tent — a reviewer workspace for institutional donors focused on vetting environmental nonprofits. Audience: the ${org.name} team. Warm, credible, concise. No greeting, no sign-off.`,
    methodology: `Write a 3–4 sentence paragraph describing Big Green Tent's review methodology: four-category capacity scoring plus qualitative mission review and human verification. Audience: the ${org.name} team. No greeting.`,
    whySelected: `Write a 3–4 sentence paragraph explaining why ${org.name} was selected for Big Green Tent's shortlist. Context: sector ${org.sector}, mission "${org.missionSummary || org.missionStatement || ''}"${org.capacityNarrative ? `, reviewer insight: "${org.capacityNarrative}"` : ''}. Cite specific strengths. No greeting.`,
    offer: `Write a 3–4 sentence paragraph describing what Big Green Tent offers partner organizations: visibility inside the donor coordination workflow, donor introductions prepared by vetted reviewers, and periodic impact syntheses. Audience: the ${org.name} team. No greeting.`,
    nextSteps: `Write 2–3 sentences suggesting next steps for ${org.name} — sharing their latest annual report, program updates, and a preferred point of contact, plus an invitation for a short introductory call. Warm and direct. No greeting, no sign-off.`,
  }

  const prompt = prompts[field]
  if (!prompt) {
    return res.status(400).json({ error: `Unknown field: ${field}` })
  }

  try {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional nonprofit outreach writer for Big Green Tent, a donor coordination platform for environmental nonprofits. Write warm, credible, concise copy. Return only the requested text — no preamble, no labels, no quotes.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.72,
    })
    const text = response.choices?.[0]?.message?.content?.trim()
    if (!text) throw new Error('Empty response from AI.')
    res.json({ text })
  } catch (err) {
    console.error('Generate outreach error:', err)
    res.status(500).json({ error: err.message || 'Generation failed.' })
  }
})

app.post('/api/approve', (req, res) => {
  const { nonprofit_id, org_ein, name, sector } = req.body || {}
  const db = getDb()
  const id = crypto.randomUUID()

  try {
    db.prepare(
      'INSERT INTO approved_organizations (id, nonprofit_id, org_ein, name, sector) VALUES (?, ?, ?, ?, ?)'
    ).run(id, nonprofit_id || null, org_ein || null, name || null, sector || DEFAULT_SECTOR)
    res.json({ success: true, id })
  } catch (err) {
    console.error('Insert error:', err)
    res.status(500).json({ error: 'Failed to approve.' })
  }
})

app.get('/api/approved', (req, res) => {
  const db = getDb()
  try {
    const rows = db
      .prepare(
        `SELECT
          a.id AS approval_id,
          a.nonprofit_id,
          a.org_ein,
          a.name AS approved_name,
          a.sector AS approved_sector,
          o.*
        FROM approved_organizations a
        LEFT JOIN organizations o ON a.org_ein = o.ein
        ORDER BY a.rowid DESC`
      )
      .all()

    res.json(
      rows
        .filter((row) => row.ein || row.org_ein)
        .map((row) => {
          const formatted = row.ein
            ? formatOrg(row)
            : {
                ein: row.org_ein,
                name: row.approved_name,
                sector: row.approved_sector || DEFAULT_SECTOR,
              }
          return {
            ...formatted,
            approval_id: row.approval_id,
            nonprofit_id: row.nonprofit_id,
            org_ein: row.org_ein || row.ein,
          }
        })
    )
  } catch (err) {
    console.error('Fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch approved orgs.' })
  }
})

app.delete('/api/approve/:id', (req, res) => {
  const { id } = req.params
  const db = getDb()
  try {
    db.prepare('DELETE FROM approved_organizations WHERE id = ?').run(id)
    res.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    res.status(500).json({ error: 'Failed to remove.' })
  }
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
