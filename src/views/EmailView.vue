<!-- src/views/EmailView.vue -->
<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase'
import { authState } from '../auth'

const router = useRouter()
const route = useRoute()
const isAdmin = computed(() => authState.role === 'admin')
watchEffect(() => {
  if (authState.ready && !isAdmin.value) router.replace('/dashboard')
})

const functions = getFunctions(app, 'australia-southeast1')
const sendEmailFn = httpsCallable(functions, 'sendEmail')

const to = ref('')
const subject = ref('')
const message = ref('')
const file = ref(null)
const sending = ref(false)
const status = ref('')

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
  if (!authState.user) {
    status.value = 'Please login first.'
    return
  }
  if (!to.value || !subject.value || !message.value) {
    status.value = 'Please fill recipient, subject and message.'
    return
  }
  if (file.value && file.value.size > 6.5 * 1024 * 1024) {
    status.value = 'Attachment too large (max ~6.5MB).'
    return
  }
  sending.value = true
  try {
    let base64 = ''
    let filename = ''
    if (file.value) {
      base64 = await toBase64(file.value)
      filename = file.value.name
    }
    const res = await sendEmailFn({
      to: to.value.trim(),
      subject: subject.value.trim(),
      message: message.value,
      attachmentBase64: base64 || undefined,
      attachmentName: filename || undefined,
    })
    status.value = res?.data?.success ? '✅ Email sent.' : '⚠️ Not sent.'
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
  <section v-if="isAdmin" class="container py-5" style="max-width: 560px">
    <h1 class="h4 mb-3">Admin · Email Center</h1>

    <div class="mb-2">
      <label class="form-label">Recipient</label>
      <input v-model="to" type="email" class="form-control" placeholder="user@example.com" />
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
        rows="6"
        placeholder="Write something..."
      ></textarea>
    </div>

    <div class="mb-3">
      <label class="form-label">Attachment</label>
      <input id="file-input" type="file" class="form-control" @change="onFileChange" />
      <small class="text-muted">Max ~6.5 MB</small>
    </div>

    <button class="btn btn-primary w-100" :disabled="sending" @click="sendEmail">
      {{ sending ? 'Sending…' : 'Send Email' }}
    </button>

    <p class="mt-3" aria-live="polite">{{ status }}</p>
  </section>

  <section v-else class="container py-5">
    <p class="text-muted">Redirecting…</p>
  </section>
</template>
