<!-- src/App.vue -->
<script setup>
import RegisterForm from './components/RegisterForm.vue'
</script>

<template>
  <main class="app-shell">
    <RegisterForm />
  </main>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f8fafc;
}
</style>
