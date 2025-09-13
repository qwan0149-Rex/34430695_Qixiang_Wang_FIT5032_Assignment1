<script setup></script>

<template>
  <header class="sticky-top bg-white border-bottom">
    <div class="container py-2">
      <ul class="nav nav-pills gap-2">
        <li class="nav-item">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/user" class="nav-link">User</RouterLink>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped></style>
