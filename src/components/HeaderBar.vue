<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { authState, logout } from '../auth.js'

const router = useRouter()
const route = useRoute()
const isAuthed = computed(() => !!authState.user)
const isAdmin = computed(() => authState.role === 'admin')
const showAdmin = computed(() => route.path.startsWith('/admin') || isAdmin.value)
const displayName = computed(
  () => authState.user?.displayName || authState.user?.email?.split('@')[0] || 'User',
)

const doLogout = async () => {
  await logout()
  router.push('/')
}

function goAI() {
  if (!authState.user) {
    router.push({ path: '/login', query: { redirect: '/ai' } })
  } else {
    router.push('/ai')
  }
}
</script>

<template>
  <header class="sticky-top bg-white border-bottom">
    <div class="container py-2">
      <ul class="nav nav-pills gap-2 align-items-center">
        <li class="nav-item">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
        </li>
        <li class="nav-item" v-if="isAuthed">
          <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
        </li>
        <li class="nav-item" v-if="showAdmin">
          <RouterLink to="/admin" class="nav-link">Admin</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" to="/map">Map</RouterLink>
        </li>
        <li class="nav-item">
          <a role="button" class="nav-link" @click.prevent="goAI">AI</a>
        </li>
        <li class="nav-item">
          <RouterLink to="/charts" class="nav-link">Charts</RouterLink>
        </li>
        <li class="nav-item ms-auto" v-if="!isAuthed">
          <RouterLink to="/user" class="nav-link">User</RouterLink>
        </li>
        <li class="nav-item ms-auto d-flex align-items-center gap-2" v-else>
          <span class="text-muted">Hi, {{ displayName }}</span>
          <button class="btn btn-sm btn-outline-secondary" @click="doLogout">Logout</button>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped></style>
