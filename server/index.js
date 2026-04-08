import './tracing.js'
import express from 'express'
import multer from 'multer'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { getDb } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { computeScore } from './scoring.js'
import { seedIfEmpty } from './seed.js'
import OpenAI from 'openai'

const envPath = path.resolve(process.cwd(), '.env')
dotenv.config({ path: envPath })

// Seed DB with mock data if empty
seedIfEmpty(getDb())

const apiKey = process.env.OPENAI_QUIZ_API_KEY
if (!apiKey) {
  console.warn('Missing OPENAI_QUIZ_API_KEY in .env')
}

const app = express()
const PORT = 8000
const tmpDir = path.resolve('server', 'tmp')

await fs.mkdir(tmpDir, { recursive: true })

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 10 * 1024 * 1024 },
})

app.use(express.json({ limit: '1mb' }))
app.use(express.static(path.join(__dirname, '../dist')))

app.get('/api/nonprofits', (req, res) => {
  const { sector, maturity, efficiency, growth, sustainability, scale } = req.query;
  const weights = { efficiency, growth, sustainability, scale };
  
  const db = getDb();
  let query = 'SELECT * FROM nonprofits';
  const params = [];
  const conditions = [];

  if (sector && sector !== 'All') {
    conditions.push('sector = ?');
    params.push(sector);
  }
  if (maturity && maturity !== 'All') {
    conditions.push('maturity = ?');
    params.push(maturity);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  try {
    const rows = db.prepare(query).all(...params);
    const results = rows.map(row => {
      row.score = computeScore(weights, row);
      return row;
    });
    
    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (err) {
    console.error('DB query error:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
})

app.post('/api/explain', async (req, res) => {
  const { nonprofit, weights } = req.body || {}
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_QUIZ_API_KEY in .env.' })
  }

  try {
    const openai = new OpenAI({ apiKey })
    
    const systemPrompt = {
      role: 'system',
      content: 'You are the Big Green Tent AI. You must explain why this nonprofit scored highly based strictly on the user\'s active weights and the nonprofit\'s raw data. Find the intersection: if the user weighted \'Innovation\' highly, and the org has high \'innovation_output\', highlight that. Start exactly with "This organization ranks highly due to..." and cite the specific metrics and mission elements that justify the score. Keep it under 35 words.'
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        systemPrompt,
        { role: 'user', content: `Nonprofit data: ${JSON.stringify(nonprofit)}\nUser weights: ${JSON.stringify(weights)}` }
      ],
      temperature: 0.7,
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error('Empty chat response.')
    }

    res.json({ explanation: reply })
  } catch (error) {
    console.error('Explain error:', error)
    res.status(500).json({ error: error.message || 'Explain failed.' })
  }
})

app.post('/api/approve', (req, res) => {
  const { nonprofit_id, name, sector } = req.body || {}
  const db = getDb()
  const id = crypto.randomUUID()
  
  try {
    const stmt = db.prepare(
      'INSERT INTO approved_organizations (id, nonprofit_id, name, sector) VALUES (?, ?, ?, ?)'
    )
    stmt.run(id, nonprofit_id, name, sector)
    res.json({ success: true, id })
  } catch (err) {
    console.error('Insert error:', err)
    res.status(500).json({ error: 'Failed to approve.' })
  }
})

app.get('/api/approved', (req, res) => {
  const db = getDb()
  try {
    const rows = db.prepare('SELECT a.id as approval_id, n.* FROM approved_organizations a JOIN nonprofits n ON a.nonprofit_id = n.id').all()
    res.json(rows)
  } catch (err) {
    console.error('Fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch approved orgs.' })
  }
})

app.delete('/api/approve/:id', (req, res) => {
  const { id } = req.params
  const db = getDb()
  try {
    const stmt = db.prepare('DELETE FROM approved_organizations WHERE nonprofit_id = ?')
    stmt.run(id)
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
