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
const PORT = Number(process.env.PORT || 8000)
const tmpDir = path.resolve('server', 'tmp')

await fs.mkdir(tmpDir, { recursive: true })

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 10 * 1024 * 1024 },
})

app.use(express.json({ limit: '1mb' }))
app.use(express.static(path.join(__dirname, '../dist')))

app.get('/healthz', (req, res) => {
  res.json({ ok: true })
})

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

app.post('/api/generate-outreach', async (req, res) => {
  const { org, field } = req.body || {}

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_QUIZ_API_KEY — add it to your .env to enable AI regeneration.' })
  }

  const prompts = {
    // Legacy email fields (kept for backward compatibility)
    recipient: `Suggest one specific recipient for a cold outreach email to ${org.name}, a ${org.maturity || ''} environmental nonprofit in the ${org.sector} sector. Return a single line like "Director of Partnerships at [org name]". No extra text.`,
    subject: `Write a professional, warm email subject line for an introduction from Big Green Tent to ${org.name} (${org.sector} sector). Keep it under 10 words. Return only the subject line, no quotes.`,
    opening: `Write the opening paragraph of a warm, professional outreach email from Big Green Tent to the ${org.name} team. Context: "${org.mission}". Sector: ${org.sector}. Start with a greeting, then explain the shortlisting and mission alignment. 3–4 sentences. No subject line.`,
    context: `Write a context paragraph for a donor outreach email to ${org.name} (${org.sector}). Explain that Big Green Tent is preparing its next round of donor introductions and this org was selected for its environmental impact. 2–3 sentences.`,
    ask: `Write a direct, warm ask paragraph for an outreach email to ${org.name}. Request a short introductory call and any current giving information or program updates. 2–3 sentences. No sign-off.`,
    closing: `Write a warm, professional email closing for an outreach from Big Green Tent to ${org.name}. Include a brief encouraging line, then a sign-off placeholder like "[Your name] / Big Green Tent Reviewer Workspace". 2–3 lines total.`,

    // Press-kit PDF fields
    aboutHeadline: `Write a short, bold headline (under 12 words) for a one-page PDF introducing Big Green Tent to ${org.name}. It should feel like a press-kit title. Return the headline only, no quotes.`,
    aboutBgt: `Write a 3–4 sentence paragraph introducing Big Green Tent — a reviewer workspace for institutional donors focused on vetting environmental nonprofits. Audience: the ${org.name} team. Warm, credible, concise. No greeting, no sign-off.`,
    methodology: `Write a 3–4 sentence paragraph describing Big Green Tent's review methodology: seven-metric scoring (program efficiency, revenue growth, sustainability, scale, grant distribution, geographic reach, innovation output) combined with human review. Audience: the ${org.name} team. No greeting.`,
    whySelected: `Write a 3–4 sentence paragraph explaining why ${org.name} was selected for Big Green Tent's shortlist. Context: sector ${org.sector}, mission "${org.mission}"${org.enrichment_summary ? `, reviewer insight: "${org.enrichment_summary}"` : ''}. Cite specific strengths. No greeting.`,
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
          content: 'You are a professional nonprofit outreach writer for Big Green Tent, a donor coordination platform for environmental nonprofits. Write warm, credible, concise copy. Return only the requested text — no preamble, no labels, no quotes.',
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
