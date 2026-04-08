/**
 * Database seeder – inserts 5 mock nonprofits if the table is empty.
 */
import crypto from 'crypto'

const SEED_DATA = [
  {
    name: 'Coastal Resilience Alliance',
    mission: 'Protecting coastal communities from rising sea levels.',
    sector: 'Climate Change',
    maturity: 'Established',
    program_efficiency: 0.85,
    revenue_growth: 0.12,
    sustainability: 0.90,
    scale: 0.75,
    location: 'Miami, FL'
  },
  {
    name: 'GreenGrid Energy Fund',
    mission: 'Investing in renewable energy infrastructure.',
    sector: 'Energy Systems',
    maturity: 'Mature',
    program_efficiency: 0.92,
    revenue_growth: 0.25,
    sustainability: 0.88,
    scale: 0.95,
    location: 'San Francisco, CA'
  },
  {
    name: 'Watershed Commons',
    mission: 'Restoring and protecting local watersheds.',
    sector: 'Water Systems',
    maturity: 'Emerging',
    program_efficiency: 0.78,
    revenue_growth: 0.40,
    sustainability: 0.85,
    scale: 0.45,
    location: 'Portland, OR'
  },
  {
    name: 'EcoAction Network',
    mission: 'Community-driven waste reduction programs.',
    sector: 'Waste Management',
    maturity: 'Emerging',
    program_efficiency: 0.80,
    revenue_growth: 0.50,
    sustainability: 0.82,
    scale: 0.30,
    location: 'Austin, TX'
  },
  {
    name: 'Solar Future Foundation',
    mission: 'Providing solar panels to low-income neighborhoods.',
    sector: 'Energy Systems',
    maturity: 'Established',
    program_efficiency: 0.89,
    revenue_growth: 0.15,
    sustainability: 0.95,
    scale: 0.60,
    location: 'Phoenix, AZ'
  }
]

/**
 * Seeds the nonprofits table if it is empty.
 * @param {import('better-sqlite3').Database} db
 */
export function seedIfEmpty(db) {
  const { cnt } = db.prepare('SELECT COUNT(*) as cnt FROM nonprofits').get()
  if (cnt > 0) return false

  const stmt = db.prepare(
    'INSERT INTO nonprofits (id, name, mission, sector, maturity, program_efficiency, revenue_growth, sustainability, scale, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const insertMany = db.transaction((rows) => {
    rows.forEach((row) => {
      stmt.run(
        crypto.randomUUID(),
        row.name,
        row.mission,
        row.sector,
        row.maturity,
        row.program_efficiency,
        row.revenue_growth,
        row.sustainability,
        row.scale,
        row.location
      )
    })
  })

  insertMany(SEED_DATA)
  console.log(`Seeded ${SEED_DATA.length} mock nonprofits.`)
  return true
}
