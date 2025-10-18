<script setup>
import { computed } from 'vue'
import { authState } from '../auth.js'

const displayName = computed(
  () => authState.user?.displayName || authState.user?.email?.split('@')[0] || 'User',
)
</script>

<template>
  <section class="container py-5">
    <h1 class="h4">Admin</h1>
    <p>Welcome! {{ displayName }}！</p>
    <RouterLink to="/email" class="btn btn-primary mt-3">Open Email Center</RouterLink>
  </section>
</template>
