const THRESHOLDS = {
  Emerging: {
    days_cash_min: 30,
    months_unrestricted_min: 1,
    current_ratio_min: 1.25,
    rev_concentration_max: 80,
    prog_expense_ratio_min: 0.65,
    fundraising_eff_min: 1.5,
    filing_continuity_min: 1.0,
    board_size_min: 3,
    employees_min: 0,
  },
  Established: {
    days_cash_min: 60,
    months_unrestricted_min: 3,
    current_ratio_min: 1.5,
    rev_concentration_max: 70,
    prog_expense_ratio_min: 0.72,
    fundraising_eff_min: 2.5,
    filing_continuity_min: 0.9,
    board_size_min: 5,
    employees_min: 3,
  },
  Mature: {
    days_cash_min: 90,
    months_unrestricted_min: 6,
    current_ratio_min: 2,
    rev_concentration_max: 60,
    prog_expense_ratio_min: 0.8,
    fundraising_eff_min: 4,
    filing_continuity_min: 0.95,
    board_size_min: 7,
    employees_min: 0,
  },
}

function asNumber(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function clamp(value, min = 0, max = 100) {
  if (!Number.isFinite(value)) return null
  return Math.max(min, Math.min(max, value))
}

function scoreAtThreshold(value, threshold) {
  const num = asNumber(value)
  if (num == null || !threshold) return null
  return clamp((num / threshold) * 100)
}

function average(scores) {
  const valid = scores.filter((score) => score != null && Number.isFinite(score))
  if (!valid.length) return null
  return Math.round(valid.reduce((sum, score) => sum + score, 0) / valid.length)
}

function scoreColor(score) {
  if (score == null) return 'red'
  if (score >= 80) return 'green'
  if (score >= 60) return 'yellow'
  return 'red'
}

function parseSurplusScore(value) {
  if (!value) return null
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/)
  if (!match) return null
  const surplus = Number(match[1])
  const total = Number(match[2])
  if (!Number.isFinite(surplus) || !Number.isFinite(total) || total <= 0) return null
  return clamp((surplus / total) * 100)
}

function scoreTrend(value) {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('growing')) return 100
  if (normalized.includes('flat') || normalized.includes('stable')) return 75
  if (normalized.includes('declining')) return 45
  return null
}

function scoreRevenueConcentration(value, threshold) {
  const pct = asNumber(value)
  if (pct == null) return null
  if (pct <= threshold) return 100
  const overage = pct - threshold
  const possibleOverage = Math.max(1, 100 - threshold)
  return clamp(100 - (overage / possibleOverage) * 60, 40, 100)
}

function scoreEarnedIncome(value) {
  const pct = asNumber(value)
  if (pct == null) return null
  return clamp(50 + pct, 50, 100)
}

function scoreFilingContinuity(value, thresholdRatio) {
  const pct = asNumber(value)
  if (pct == null) return null
  const thresholdPct = thresholdRatio * 100
  return scoreAtThreshold(pct, thresholdPct)
}

function scoreEmployeeCapacity(value, threshold) {
  const employees = asNumber(value)
  if (employees == null) return null
  if (threshold <= 0) return 100
  return scoreAtThreshold(employees, threshold)
}

function scoreRevenueBand(value) {
  const revenue = asNumber(value)
  if (revenue == null) return null
  if (revenue < 500000) return clamp((revenue / 500000) * 100)
  if (revenue <= 5000000) return 100
  return clamp(100 - ((revenue - 5000000) / 5000000) * 100)
}

function scoreYearsWithinTier(years, maturityTier) {
  const value = asNumber(years)
  if (value == null) return null
  if (maturityTier === 'Emerging') return clamp((Math.max(0, 5 - value) / 5) * 40 + 60)
  if (maturityTier === 'Established') {
    if (value >= 5 && value < 15) return 100
    const distance = value < 5 ? 5 - value : value - 15
    return clamp(100 - distance * 8, 60, 100)
  }
  if (maturityTier === 'Mature') return value >= 15 ? 100 : clamp((value / 15) * 100)
  return null
}

function calibratedScoresForOrg(org) {
  const raw = org.rawMetrics || {}
  const maturityTier = org.maturityTier || 'Established'
  const thresholds = THRESHOLDS[maturityTier] || THRESHOLDS.Established

  const financialStability = average([
    scoreAtThreshold(raw.daysCashOnHand, thresholds.days_cash_min),
    scoreAtThreshold(raw.monthsUnrestricted, thresholds.months_unrestricted_min),
    scoreAtThreshold(raw.currentRatio, thresholds.current_ratio_min),
    parseSurplusScore(raw.surplusDeficit3yr),
  ])

  const revenueHealth = average([
    scoreTrend(raw.revenueTrend),
    scoreRevenueConcentration(raw.revConcentrationPct, thresholds.rev_concentration_max),
    scoreEarnedIncome(raw.earnedIncomePct),
  ])

  const operationalEfficiency = average([
    scoreAtThreshold(raw.programExpenseRatio, thresholds.prog_expense_ratio_min),
    scoreAtThreshold(raw.fundraisingEfficiency, thresholds.fundraising_eff_min),
    scoreFilingContinuity(
      raw.filingContinuityAdjusted ?? raw.filingContinuityRaw,
      thresholds.filing_continuity_min
    ),
  ])

  const organizationalMaturity = average([
    scoreYearsWithinTier(raw.yearsActive, maturityTier),
    scoreAtThreshold(raw.boardSize, thresholds.board_size_min),
    scoreEmployeeCapacity(raw.latestEmployees, thresholds.employees_min),
    scoreRevenueBand(raw.currentRevenue),
  ])

  const overallScore = average([
    financialStability,
    revenueHealth,
    operationalEfficiency,
    organizationalMaturity,
  ])

  return {
    overallScore,
    financialStability: {
      score: financialStability,
      color: scoreColor(financialStability),
    },
    revenueHealth: {
      score: revenueHealth,
      color: scoreColor(revenueHealth),
    },
    operationalEfficiency: {
      score: operationalEfficiency,
      color: scoreColor(operationalEfficiency),
    },
    organizationalMaturity: {
      score: organizationalMaturity,
      color: scoreColor(organizationalMaturity),
    },
  }
}

export { THRESHOLDS, calibratedScoresForOrg }
