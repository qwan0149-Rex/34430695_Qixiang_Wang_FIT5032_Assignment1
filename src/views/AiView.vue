<!-- src/views/AIView.vue -->
<template>
  <div class="container mx-auto p-4 max-w-3xl">
    <h1 class="text-2xl font-bold mb-4">AI Assistant</h1>
    <p class="text-gray-600 mb-4">
      Ask me a question and press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send.
    </p>

    <div class="border rounded p-3 h-96 overflow-y-auto mb-3 bg-gray-50">
      <div v-if="messages.length === 0" class="text-gray-500">
        Hi! I am your AI Assistant. Ask me anything about health or nutrition!
      </div>
      <div v-for="(m, i) in messages" :key="i" class="mb-3">
        <div class="font-semibold" :class="m.role === 'user' ? 'text-blue-600' : 'text-green-700'">
          {{ m.role === 'user' ? 'You' : 'AI' }}
        </div>
        <div class="whitespace-pre-wrap">{{ m.content }}</div>
      </div>
      <div v-if="loading" class="text-sm text-gray-500">AI is thinking…</div>
    </div>

    <form @submit.prevent="handleSend" class="flex gap-2">
      <input
        v-model="input"
        class="flex-1 border rounded px-3 py-2"
        placeholder="Type your message here..."
        @keydown.enter.ctrl.prevent="handleSend"
      />
      <button :disabled="loading || !input.trim()" class="border rounded px-4 py-2">Send</button>
    </form>

    <p class="text-xs text-gray-500 mt-3">
      Disclaimer: This assistant provides general information only and does not offer medical
      diagnosis.
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authState } from '@/auth'
import { askAI } from '@/services/aiService'

const router = useRouter()
const messages = ref([])
const input = ref('')
const loading = ref(false)

async function handleSend() {
  const q = input.value.trim()
  if (!q) return
  if (!authState.user) {
    alert('Please Login')
    router.push({ name: 'login', query: { redirect: '/ai' } })
    return
  }
  messages.value.push({ role: 'user', content: q })
  input.value = ''
  loading.value = true
  try {
    const answer = await askAI(q, messages.value)
    messages.value.push({ role: 'assistant', content: answer })
  } catch (e) {
    console.error(e)
    messages.value.push({ role: 'assistant', content: 'Something Wrong：' + (e?.message || e) })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 768px;
}
</style>
