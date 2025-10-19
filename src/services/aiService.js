import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth } from 'firebase/auth'

const functions = getFunctions(undefined, 'australia-southeast1')
const genai = httpsCallable(functions, 'genai')

export async function askAI(question, history = []) {
  const auth = getAuth()
  if (!auth.currentUser) throw new Error('UNAUTHENTICATED')

  const last = history.slice(-6)
  const context = last
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')
  const prompt = `You are a helpful assistant. Use concise Chinese unless asked for English.

Chat history:
${context}

User question:
${question}`

  const res = await genai({ prompt })
  return res?.data?.text || ''
}
