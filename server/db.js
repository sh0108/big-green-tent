/* global process */
import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve('server', 'big_green_tent.db')
let db

export function getDb() {
  if (db) return db
  db = new Database(DB_PATH)
  const schemaPath = path.resolve('server', 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  db.exec(schema)
  ensureMigrations(db)
  return db
}

function ensureMigrations(database) {
  const approvedCols = new Set(
    database.prepare('PRAGMA table_info(approved_organizations)').all().map((col) => col.name)
  )

  if (!approvedCols.has('org_ein')) {
    database.exec('ALTER TABLE approved_organizations ADD COLUMN org_ein TEXT')
  }

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_organizations_inScope ON organizations(inScope);
    CREATE INDEX IF NOT EXISTS idx_organizations_state ON organizations(state);
    CREATE INDEX IF NOT EXISTS idx_organizations_maturityTier ON organizations(maturityTier);
    CREATE INDEX IF NOT EXISTS idx_organizations_confidenceBand ON organizations(confidenceBand);
    CREATE INDEX IF NOT EXISTS idx_organizations_programFocus ON organizations(programFocus);
    CREATE INDEX IF NOT EXISTS idx_organizations_websiteMissionMatch ON organizations(websiteMissionMatch);
    CREATE INDEX IF NOT EXISTS idx_approved_org_ein ON approved_organizations(org_ein);
  `)
}
