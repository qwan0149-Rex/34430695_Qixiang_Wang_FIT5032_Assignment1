<!-- src/views/EmailView.vue -->
<script setup>
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app, db } from '../firebase'
import { authState } from '../auth'
import { doc, updateDoc, increment, collection, getDocs, orderBy, query } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const FN_URL =
  'https://australia-southeast1-fit5032-assignment1-e5365.cloudfunctions.net/bulkEmail2'
async function sendBulkEmailHTTP({ recipients, subject, html, text }) {
  const user = getAuth().currentUser
  if (!user) throw new Error('UNAUTHENTICATED')
  const token = await user.getIdToken()
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipients, subject, html, text }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => '')}`)
  return res.json()
}

const functions = getFunctions(app, 'australia-southeast1')
const sendEmailFn = httpsCallable(functions, 'sendEmail')

const router = useRouter()
const route = useRoute()
const isAdmin = computed(() => authState.role === 'admin')
watchEffect(() => {
  if (authState.ready && !isAdmin.value) router.replace('/dashboard')
})

const to = ref('')
const subject = ref('')
const message = ref('')
const file = ref(null)
const sending = ref(false)
const status = ref('')
const bulkResult = ref(null)

const users = ref([])
const loadingUsers = ref(false)
const onlySubscribed = ref(true)
const search = ref('')
const allChecked = ref(false)

onMounted(loadUsers)
async function loadUsers() {
  loadingUsers.value = true
  try {
    let snap
    try {
      const q = query(collection(db, 'users'), orderBy('name'))
      snap = await getDocs(q)
    } catch (e) {
      console.warn('orderBy(name) failed, fallback without orderBy:', e?.message)
      snap = await getDocs(collection(db, 'users'))
    }

    users.value = snap.docs.map((d) => {
      const u = d.data() || {}
      return {
        uid: d.id,
        email: u.email || '',
        displayName: u.displayName || u.name || '(no name)',
        role: u.role || 'user',
        subscribed: u.subscribed !== false,
        checked: false,
      }
    })
  } finally {
    loadingUsers.value = false
  }
}

const filteredUsers = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return users.value.filter((u) => {
    if (onlySubscribed.value && !u.subscribed) return false
    if (!kw) return true
    return (
      u.displayName.toLowerCase().includes(kw) ||
      u.email.toLowerCase().includes(kw) ||
      u.role.toLowerCase().includes(kw)
    )
  })
})
function toggleAll() {
  filteredUsers.value.forEach((u) => (u.checked = allChecked.value))
}
const selectedEmails = computed(() =>
  users.value.filter((u) => u.checked && u.email).map((u) => u.email),
)

const onFileChange = (e) => {
  file.value = e.target.files?.[0] || null
}
const toBase64 = async (f) => {
  const buf = await f.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

const sendEmail = async () => {
  status.value = ''
  bulkResult.value = null

  if (!authState.user) {
    status.value = 'Please login first.'
    return
  }
  if (!subject.value || !message.value) {
    status.value = 'Please fill subject and message.'
    return
  }
  if (file.value && file.value.size > 6.5 * 1024 * 1024) {
    status.value = 'Attachment too large (max ~6.5MB).'
    return
  }

  const manual = to.value
    .split(/[,\s;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const recipients = Array.from(new Set([...selectedEmails.value, ...manual]))

  if (recipients.length === 0) {
    status.value = 'Please select at least one recipient or type an email.'
    return
  }

  sending.value = true
  try {
    if (recipients.length > 1) {
      if (file.value) status.value = 'Attachment is ignored in bulk mode.'
      const html = `<p>${message.value.replace(/\n/g, '<br/>')}</p>`
      const res = await sendBulkEmailHTTP({
        recipients,
        subject: subject.value.trim(),
        html,
        text: message.value,
      })
      bulkResult.value = res
      status.value = `✅ Bulk sent: ${res.success}/${res.total} succeeded${res.failed ? `, ${res.failed} failed` : ''}.`
      try {
        await updateDoc(doc(db, 'stats', 'global'), {
          emailsSent: increment(Math.max(0, res.success || 0)),
        })
      } catch {}
    } else {
      const one = recipients[0]
      let base64 = '',
        filename = ''
      if (file.value) {
        base64 = await toBase64(file.value)
        filename = file.value.name
      }
      const res = await sendEmailFn({
        to: one,
        subject: subject.value.trim(),
        message: message.value,
        attachmentBase64: base64 || undefined,
        attachmentName: filename || undefined,
      })
      const ok = !!res?.data?.success
      status.value = ok ? '✅ Email sent.' : '⚠️ Not sent.'
      if (ok) {
        try {
          await updateDoc(doc(db, 'stats', 'global'), { emailsSent: increment(1) })
        } catch {}
      }
    }

    to.value = ''
    subject.value = ''
    message.value = ''
    file.value = null
    const input = document.getElementById('file-input')
    if (input) input.value = ''
  } catch (err) {
    console.error(err)
    status.value = '❌ ' + (err?.message || 'Failed to send email.')
  } finally {
    sending.value = false
  }
}

if (typeof route.query.to === 'string') to.value = route.query.to
if (typeof route.query.subject === 'string') subject.value = route.query.subject
</script>

<template>
  <section v-if="isAdmin" class="container py-5" style="max-width: 960px">
    <h1 class="h4 mb-3">Admin · Email Center</h1>

    <div class="row g-4">
      <div class="col-lg-6">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="d-flex align-items-center gap-2">
            <input id="subOnly" type="checkbox" v-model="onlySubscribed" />
            <label for="subOnly" class="mb-0">Only subscribed</label>
          </div>
          <input
            class="form-control"
            style="max-width: 220px"
            v-model="search"
            placeholder="Search name/email/role"
          />
        </div>

        <div
          class="table-responsive"
          style="max-height: 360px; overflow: auto; border: 1px solid #e9ecef; border-radius: 8px"
        >
          <table class="table table-sm mb-0">
            <thead class="table-light" style="position: sticky; top: 0; z-index: 1">
              <tr>
                <th style="width: 42px">
                  <input type="checkbox" v-model="allChecked" @change="toggleAll" />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th style="width: 90px">Role</th>
                <th style="width: 90px">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingUsers">
                <td colspan="5" class="text-muted">Loading users…</td>
              </tr>
              <tr v-for="u in filteredUsers" :key="u.uid">
                <td><input type="checkbox" v-model="u.checked" /></td>
                <td>{{ u.displayName }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.role }}</td>
                <td>{{ u.subscribed ? 'Yes' : 'No' }}</td>
              </tr>
              <tr v-if="!loadingUsers && filteredUsers.length === 0">
                <td colspan="5" class="text-muted">No users.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="small text-muted mt-2">
          Selected: <strong>{{ selectedEmails.length }}</strong>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="mb-2">
          <label class="form-label">Additional recipient(s) (optional)</label>
          <input
            v-model="to"
            type="text"
            class="form-control"
            placeholder="user@example.com, user2@example.com"
          />
          <small class="text-muted"
            >Use comma / semicolon / space to separate multiple emails.</small
          >
        </div>

        <div class="mb-2">
          <label class="form-label">Subject</label>
          <input v-model="subject" type="text" class="form-control" placeholder="Subject..." />
        </div>

        <div class="mb-2">
          <label class="form-label">Message</label>
          <textarea
            v-model="message"
            class="form-control"
            rows="8"
            placeholder="Write something..."
          ></textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">Attachment (single-recipient only)</label>
          <input id="file-input" type="file" class="form-control" @change="onFileChange" />
          <small class="text-muted">Max ~6.5 MB. Bulk mode ignores attachment.</small>
        </div>

        <button class="btn btn-primary w-100" :disabled="sending" @click="sendEmail">
          {{ sending ? 'Sending…' : 'Send Email / Bulk Email' }}
        </button>

        <p class="mt-3" aria-live="polite">{{ status }}</p>

        <div v-if="bulkResult" class="mt-2 small">
          <div>
            Total: {{ bulkResult.total }}, Success: {{ bulkResult.success }}, Failed:
            {{ bulkResult.failed }}
          </div>
          <ul v-if="bulkResult.failedList?.length" class="text-muted">
            <li v-for="f in bulkResult.failedList" :key="f.to">
              {{ f.to }} — {{ typeof f.error === 'string' ? f.error : JSON.stringify(f.error) }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section v-else class="container py-5">
    <p class="text-muted">Redirecting…</p>
  </section>
</template>
