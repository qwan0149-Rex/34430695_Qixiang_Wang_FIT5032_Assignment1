// src/services/bulkEmailService.js
import { getAuth } from 'firebase/auth'

export async function sendBulkEmail({ url, recipients, subject, html, text }) {
  const user = getAuth().currentUser
  if (!user) throw new Error('UNAUTHENTICATED')
  const token = await user.getIdToken()

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipients, subject, html, text }),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${t}`)
  }
  return res.json()
}
