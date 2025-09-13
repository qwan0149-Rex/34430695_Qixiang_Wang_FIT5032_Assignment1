<!-- src/App.vue -->
<script setup>
// import RegisterForm from './components/RegisterForm.vue'
import HeaderBar from './components/HeaderBar.vue'
</script>

<template>
  <main class="app-shell">
    <!-- <RegisterForm /> -->
    <HeaderBar />
    <RouterView />
  </main>
</template>

<style scoped>
:root {
  --nav-h: 56px;
}
html,
body,
#app {
  height: 100%;
  margin: 0;
}
.page {
  padding-top: var(--nav-h);
}
</style>
