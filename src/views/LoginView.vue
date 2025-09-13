<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../auth.js'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    const user = await login(email.value.trim(), password.value)
    const snap = await getDoc(doc(db, 'users', user.uid))
    const role = snap.exists() ? snap.data().role : 'user'
    router.push(role === 'admin' ? '/admin' : '/dashboard')
  } catch (e) {
    const code = e?.code || ''
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      error.value = 'Invalid email or password.'
    } else if (code === 'auth/user-not-found') {
      error.value = 'User not found.'
    } else if (code === 'auth/too-many-requests') {
      error.value = 'Too many attempts. Try later.'
    } else {
      error.value = e?.message || 'Login failed.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="container py-5" style="max-width: 420px">
    <h1 class="h4 mb-3">Login</h1>
    <form @submit.prevent="submit" novalidate>
      <input v-model="email" class="form-control mb-2" type="email" placeholder="Email" required />
      <input
        v-model="password"
        class="form-control mb-2"
        type="password"
        placeholder="Password"
        required
      />
      <button class="btn btn-primary w-100" :disabled="loading">
        <span v-if="!loading">Sign in</span>
        <span v-else>Signing in…</span>
      </button>
      <p v-if="error" class="text-danger mt-2">{{ error }}</p>
    </form>
  </section>
</template>
