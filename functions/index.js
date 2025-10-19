// functions/index.js
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')
const sgMail = require('@sendgrid/mail')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { onRequest } = require('firebase-functions/v2/https')

admin.initializeApp()

const SENDGRID_KEY = defineSecret('SENDGRID_KEY')

exports.sendEmail = onCall(
  { region: 'australia-southeast1', secrets: [SENDGRID_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Please log in first.')
    }

    const key = (process.env.SENDGRID_KEY || '').trim()
    if (!key.startsWith('SG.') || key.length < 25) {
      logger.error('SENDGRID_KEY missing or invalid at runtime')
      throw new HttpsError('failed-precondition', 'SendGrid key not available at runtime.')
    }
    sgMail.setApiKey(key)
    logger.info('SendGrid key loaded (masked): ' + key.slice(0, 6) + '...' + key.slice(-4))

    const { to, subject, message, attachmentBase64, attachmentName, sandbox } = request.data || {}
    if (!to || !subject || !message) {
      throw new HttpsError('invalid-argument', 'Missing email fields.')
    }

    const msg = {
      to,
      from: '0725rex@gmail.com',
      subject,
      html: `<p>${message}</p>`,
    }

    if (attachmentBase64 && attachmentName) {
      msg.attachments = [
        {
          content: attachmentBase64,
          filename: attachmentName,
          type: 'application/octet-stream',
          disposition: 'attachment',
        },
      ]
    }

    try {
      await sgMail.send(msg)
      return { success: true }
    } catch (err) {
      const details =
        (err?.response?.body?.errors &&
          err.response.body.errors.map((e) => e.message).join('; ')) ||
        err?.response?.body?.message ||
        err?.message ||
        'Unknown error'
      logger.error('SendGrid Error', err?.response?.body || err)
      throw new HttpsError('internal', details)
    }
  },
)

exports.calculateBMI = onCall({ region: 'australia-southeast1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Please log in first.')
  }

  const { height, weight } = request.data || {}
  const h = Number(height)
  const w = Number(weight)

  if (!h || !w || h <= 0 || w <= 0) {
    throw new HttpsError('invalid-argument', 'Invalid height or weight.')
  }

  const bmi = w / Math.pow(h / 100, 2)

  let category = ''
  if (bmi < 18.5) category = 'Underweight'
  else if (bmi < 24.9) category = 'Normal weight'
  else if (bmi < 29.9) category = 'Overweight'
  else category = 'Obese'

  return {
    bmi: bmi.toFixed(2),
    category,
    message: `Your BMI is ${bmi.toFixed(2)} — ${category}.`,
  }
})

const GENAI_API_KEY = defineSecret('GENAI_API_KEY')

exports.genai = onCall(
  { region: 'australia-southeast1', secrets: [GENAI_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Please log in first.')
    }
    const { prompt } = request.data || {}
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new HttpsError('invalid-argument', 'Prompt is required.')
    }

    const key = (process.env.GENAI_API_KEY || '').trim()
    if (!key || !key.startsWith('AIza')) {
      throw new HttpsError('failed-precondition', 'GENAI_API_KEY missing or invalid.')
    }

    try {
      const genAI = new GoogleGenerativeAI(key)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent(prompt)
      const text = result?.response?.text?.() || '(no output)'
      return { text }
    } catch (e) {
      console.error('[genai] SDK error:', e)
      const msg = e?.message || String(e)
      if (/403|permission/i.test(msg)) {
        throw new HttpsError('permission-denied', 'Gemini permission denied')
      }
      if (/404|not\s*found/i.test(msg)) {
        throw new HttpsError('internal', 'Gemini 404')
      }
      if (/429|quota|exceed/i.test(msg)) {
        throw new HttpsError('resource-exhausted', 'Gemini quota exceeded')
      }
      throw new HttpsError('internal', msg)
    }
  },
)

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')
const SENDER_EMAIL = defineSecret('SENDER_EMAIL')

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

exports.bulkEmail = onRequest(
  {
    region: 'australia-southeast1',
    secrets: [SENDGRID_API_KEY, SENDER_EMAIL],
    timeoutSeconds: 540,
  },
  async (req, res) => {
    setCors(res)
    if (req.method === 'OPTIONS') return res.status(204).send('')

    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

      const authHeader = req.headers.authorization || ''
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
      if (!idToken) return res.status(401).json({ error: 'Unauthenticated' })

      let decoded
      try {
        decoded = await admin.auth().verifyIdToken(idToken)
      } catch {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const { recipients, subject, html, text } = req.body || {}
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'recipients required' })
      }
      if (!subject || !html) {
        return res.status(400).json({ error: 'subject/html required' })
      }

      const key = (process.env.SENDGRID_API_KEY || '').trim()
      const fromEmail = (process.env.SENDER_EMAIL || '').trim()
      if (!key || !fromEmail) return res.status(500).json({ error: 'Email secrets missing' })

      sgMail.setApiKey(key)

      const unique = [...new Set(recipients.map((r) => (r || '').trim().toLowerCase()))].filter(
        (r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r),
      )
      if (unique.length === 0) return res.status(400).json({ error: 'no valid emails' })

      const batches = chunk(unique, 100)
      const results = []
      for (const group of batches) {
        const jobs = group.map((to) =>
          sgMail
            .send({
              to,
              from: fromEmail,
              subject,
              html,
              text: text || html.replace(/<[^>]+>/g, ' '),
            })
            .then(() => ({ to, ok: true }))
            .catch((err) => {
              console.error('SendGrid error:', to, err?.response?.body || err?.message || err)
              return { to, ok: false, error: err?.response?.body || err?.message || 'unknown' }
            }),
        )
        const r = await Promise.all(jobs)
        results.push(...r)
        await new Promise((r) => setTimeout(r, 400))
      }

      const okCount = results.filter((x) => x.ok).length
      const fail = results.filter((x) => !x.ok)
      return res.json({
        total: unique.length,
        success: okCount,
        failed: fail.length,
        failedList: fail,
      })
    } catch (e) {
      console.error('bulkEmail2 error:', e)
      return res.status(500).json({ error: 'server error' })
    }
  },
)
