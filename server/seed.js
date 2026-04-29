import fs from 'fs'
import path from 'path'

const DATA_PATH = path.resolve('server', 'bgt_orgs_data_v2.json')
const DEFAULT_SECTOR = 'Water Systems & Marine & Coastal Ecosystems'

const INSERT_SQL = `
  INSERT OR REPLACE INTO organizations (
    ein,
    name,
    state,
    region,
    sector,
    maturityTier,
    inScope,
    eligibilityFlag,
    eligibilityFlagLabel,
    confidenceBand,
    missionAlignmentScore,
    missionAlignmentRationale,
    programFocus,
    programFocusRationale,
    websiteMissionMatch,
    websiteRecentActivity,
    websiteConsistencySignal,
    websiteStatus,
    websiteUrl,
    capacityNarrative,
    missionSummary,
    primaryPrograms,
    geographicScope,
    notableSignals,
    riskSignals,
    hardRedFlags,
    softFlags,
    missionStatement,
    program1Desc,
    program2Desc,
    program3Desc,
    scheduleO,
    websiteTextExcerpt,
    scoreFinancialStability,
    scoreRevenueHealth,
    scoreOperationalEfficiency,
    scoreOrganizationalMaturity,
    scoreOverall,
    colorFinancialStability,
    colorRevenueHealth,
    colorOperationalEfficiency,
    colorOrganizationalMaturity,
    filingContinuityRaw,
    filingContinuityAdjusted,
    filingContinuityAdjustedNote,
    currentRevenue,
    yearsActive,
    boardSize,
    latestEmployees
  ) VALUES (
    @ein,
    @name,
    @state,
    @region,
    @sector,
    @maturityTier,
    @inScope,
    @eligibilityFlag,
    @eligibilityFlagLabel,
    @confidenceBand,
    @missionAlignmentScore,
    @missionAlignmentRationale,
    @programFocus,
    @programFocusRationale,
    @websiteMissionMatch,
    @websiteRecentActivity,
    @websiteConsistencySignal,
    @websiteStatus,
    @websiteUrl,
    @capacityNarrative,
    @missionSummary,
    @primaryPrograms,
    @geographicScope,
    @notableSignals,
    @riskSignals,
    @hardRedFlags,
    @softFlags,
    @missionStatement,
    @program1Desc,
    @program2Desc,
    @program3Desc,
    @scheduleO,
    @websiteTextExcerpt,
    @scoreFinancialStability,
    @scoreRevenueHealth,
    @scoreOperationalEfficiency,
    @scoreOrganizationalMaturity,
    @scoreOverall,
    @colorFinancialStability,
    @colorRevenueHealth,
    @colorOperationalEfficiency,
    @colorOrganizationalMaturity,
    @filingContinuityRaw,
    @filingContinuityAdjusted,
    @filingContinuityAdjustedNote,
    @currentRevenue,
    @yearsActive,
    @boardSize,
    @latestEmployees
  )
`

function safeText(value) {
  if (value == null) return null
  const text = String(value).trim()
  return text ? text : null
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function toRiskSignals(value) {
  if (Array.isArray(value)) return JSON.stringify(value)
  return JSON.stringify([])
}

function flattenOrg(org, inScope) {
  const scores = org.scores || {}
  const rawMetrics = org.rawMetrics || {}

  return {
    ein: safeText(org.ein),
    name: safeText(org.name),
    state: safeText(org.state),
    region: safeText(org.region),
    sector: DEFAULT_SECTOR,
    maturityTier: safeText(org.maturityTier),
    inScope: inScope ? 1 : 0,
    eligibilityFlag: safeText(org.eligibilityFlag),
    eligibilityFlagLabel: safeText(org.eligibilityFlagLabel),
    confidenceBand: safeText(org.confidenceBand),
    missionAlignmentScore: safeNumber(org.missionAlignmentScore),
    missionAlignmentRationale: safeText(org.missionAlignmentRationale),
    programFocus: safeText(org.programFocus),
    programFocusRationale: safeText(org.programFocusRationale),
    websiteMissionMatch: safeText(org.websiteMissionMatch),
    websiteRecentActivity: safeText(org.websiteRecentActivity),
    websiteConsistencySignal: safeText(org.websiteConsistencySignal),
    websiteStatus: safeText(org.websiteStatus),
    websiteUrl: safeText(org.websiteUrl),
    capacityNarrative: safeText(org.capacityNarrative),
    missionSummary: safeText(org.missionSummary),
    primaryPrograms: safeText(org.primaryPrograms),
    geographicScope: safeText(org.geographicScope),
    notableSignals: safeText(org.notableSignals),
    riskSignals: toRiskSignals(org.riskSignals),
    hardRedFlags: safeText(org.hardRedFlags),
    softFlags: safeText(org.softFlags),
    missionStatement: safeText(org.missionStatement),
    program1Desc: safeText(org.program1Desc),
    program2Desc: safeText(org.program2Desc),
    program3Desc: safeText(org.program3Desc),
    scheduleO: safeText(org.scheduleO),
    websiteTextExcerpt: safeText(org.websiteTextExcerpt),
    scoreFinancialStability: safeNumber(scores.financialStability?.score),
    scoreRevenueHealth: safeNumber(scores.revenueHealth?.score),
    scoreOperationalEfficiency: safeNumber(scores.operationalEfficiency?.score),
    scoreOrganizationalMaturity: safeNumber(scores.organizationalMaturity?.score),
    scoreOverall: safeNumber(scores.overallScore),
    colorFinancialStability: safeText(scores.financialStability?.color),
    colorRevenueHealth: safeText(scores.revenueHealth?.color),
    colorOperationalEfficiency: safeText(scores.operationalEfficiency?.color),
    colorOrganizationalMaturity: safeText(scores.organizationalMaturity?.color),
    filingContinuityRaw: safeNumber(rawMetrics.filingContinuityRaw),
    filingContinuityAdjusted: safeNumber(rawMetrics.filingContinuityAdjusted),
    filingContinuityAdjustedNote: safeText(rawMetrics.filingContinuityAdjustedNote),
    currentRevenue: safeNumber(rawMetrics.currentRevenue),
    yearsActive: safeNumber(rawMetrics.yearsActive),
    boardSize: safeNumber(rawMetrics.boardSize),
    latestEmployees: safeNumber(rawMetrics.latestEmployees),
  }
}

export function seedIfEmpty(db) {
  const { cnt } = db.prepare('SELECT COUNT(*) AS cnt FROM organizations').get()
  if (cnt > 0) return false

  const raw = fs.readFileSync(DATA_PATH, 'utf8')
  const data = JSON.parse(raw)
  const rows = [
    ...(data.mainOrgs || []).map((org) => flattenOrg(org, true)),
    ...(data.manualReviewOrgs || []).map((org) => flattenOrg(org, false)),
  ]

  const insert = db.prepare(INSERT_SQL)
  const insertMany = db.transaction((records) => {
    records.forEach((record) => insert.run(record))
  })

  insertMany(rows)
  console.log(`Seeded ${rows.length} organizations from bgt_orgs_data_v2.json.`)
  return true
}
