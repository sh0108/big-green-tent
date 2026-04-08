import './tracing.js'
import express from 'express'
import multer from 'multer'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { getDb } from './db.js'
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
  const nonprofit = req.body || {}
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_QUIZ_API_KEY in .env.' })
  }

  try {
    const openai = new OpenAI({ apiKey })
    
    const systemPrompt = {
      role: 'system',
      content: 'You are an AI assistant for Big Green Tent. Your task is to provide a transparent, synthetic, and professional explanation (maximum 30 words) for why a nonprofit organization ranks highly based on the provided metrics. Always start your response exactly with: "This organization ranks highly due to...". Be extremely concise and objective.'
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        systemPrompt,
        { role: 'user', content: `Nonprofit data: ${JSON.stringify(nonprofit)}` }
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
