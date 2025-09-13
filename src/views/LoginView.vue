<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../auth.js'

const email = ref('')
const password = ref('')
const err = ref('')
const router = useRouter()

const submit = async () => {
  err.value = ''
  try {
    await login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    err.value = e?.message || 'Login failed'
  }
}
</script>

<template>
  <section class="container py-5" style="max-width: 420px">
    <h1 class="h4 mb-3">Login</h1>
    <form @submit.prevent="submit">
      <input v-model="email" class="form-control mb-2" type="email" placeholder="Email" required />
      <input
        v-model="password"
        class="form-control mb-2"
        type="password"
        placeholder="Password"
        required
      />
      <button class="btn btn-primary w-100">Sign in</button>
      <p v-if="err" class="text-danger mt-2">{{ err }}</p>
    </form>
  </section>
</template>
