<!-- src/components/RegisterForm.vue -->
<script setup>
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

function handleSubmit() {
  console.log('Register form submitted:', {
    name: name.value,
    email: email.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  })
  alert('Submitted!')
}
</script>

<template>
  <div class="register-card">
    <h1>Register</h1>

    <form @submit.prevent="handleSubmit" class="form">
      <label class="label">
        <span>Name</span>
        <input v-model="name" type="text" placeholder="Your full name" />
      </label>

      <label class="label">
        <span>Email</span>
        <input v-model="email" type="email" placeholder="name@example.com" />
      </label>

      <label class="label">
        <span>Password</span>
        <input v-model="password" type="password" placeholder="At least 8 characters" />
      </label>

      <label class="label">
        <span>Confirm Password</span>
        <input v-model="confirmPassword" type="password" placeholder="Re-enter password" />
      </label>

      <button type="submit" class="btn">Create Account</button>
    </form>
  </div>
</template>

<style scoped>
.register-card {
  width: 100%;
  max-width: 420px;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.06);
  background: #fff;
}
h1 {
  font-size: 24px;
  margin: 0 0 16px 0;
}
.form {
  display: grid;
  gap: 12px;
}
.label {
  display: grid;
  gap: 6px;
}
input {
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  outline: none;
}
input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.btn {
  height: 44px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  background: #6366f1;
  color: #fff;
  transition:
    transform 0.02s,
    opacity 0.2s;
  margin-top: 8px;
}
.btn:hover {
  opacity: 0.95;
}
.hint {
  margin-top: 12px;
  color: #6b7280;
  font-size: 13px;
  text-align: center;
}
</style>
