<!-- src/components/RegisterForm.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

// state
const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = ref({
  name: null,
  email: null,
  password: null,
  confirmPassword: null,
})

// validators
const validateName = (blur) => {
  if (formData.value.name.trim().length < 3) {
    if (blur) errors.value.name = 'Name must be at least 3 characters'
  } else {
    errors.value.name = null
  }
}

const validateEmail = (blur) => {
  const val = formData.value.email.trim()
  if (!val) {
    if (blur) errors.value.email = 'Email is required'
  } else {
    const re = /^\S+@\S+\.\S+$/
    if (!re.test(val)) {
      if (blur) errors.value.email = 'Invalid email format'
    } else {
      errors.value.email = null
    }
  }
}

const validatePassword = (blur) => {
  const pwd = formData.value.password
  const minLength = 8
  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasNum = /\d/.test(pwd)
  const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)

  if (pwd.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters long.`
  } else if (!hasUpper) {
    if (blur) errors.value.password = 'Password must contain at least one uppercase letter.'
  } else if (!hasLower) {
    if (blur) errors.value.password = 'Password must contain at least one lowercase letter.'
  } else if (!hasNum) {
    if (blur) errors.value.password = 'Password must contain at least one number.'
  } else if (!hasSpec) {
    if (blur) errors.value.password = 'Password must contain at least one special character.'
  } else {
    errors.value.password = null
  }
}

const validateConfirm = (blur) => {
  if (!formData.value.confirmPassword) {
    if (blur) errors.value.confirmPassword = 'Please confirm your password'
  } else if (formData.value.confirmPassword !== formData.value.password) {
    if (blur) errors.value.confirmPassword = 'Passwords do not match'
  } else {
    errors.value.confirmPassword = null
  }
}

// submit
const isDisabled = computed(() => {
  const f = formData.value
  return (
    !f.name ||
    !f.email ||
    !f.password ||
    !f.confirmPassword ||
    errors.value.name ||
    errors.value.email ||
    errors.value.password ||
    errors.value.confirmPassword
  )
})

const handleSubmit = () => {
  validateName(true)
  validateEmail(true)
  validatePassword(true)
  validateConfirm(true)

  if (
    !errors.value.name &&
    !errors.value.email &&
    !errors.value.password &&
    !errors.value.confirmPassword
  ) {
    const user = {
      id: crypto?.randomUUID?.() || String(Date.now()),
      name: formData.value.name.trim(),
      email: formData.value.email.trim(),
      password: formData.value.password,
      passwordMasked: '•'.repeat(formData.value.password.length),
    }
    users.value.push(user)
    localStorage.setItem('users', JSON.stringify(users.value))
    clearForm()
    alert('Submitted! (valid)')
  }
}

const users = ref([])
onMounted(() => {
  users.value = JSON.parse(localStorage.getItem('users') || '[]')
})

const clearForm = () => {
  formData.value = { name: '', email: '', password: '', confirmPassword: '' }
}

const removeUser = (id) => {
  users.value = users.value.filter((u) => u.id !== id)
}

const clearAll = () => {
  if (confirm('Clear all saved users?')) {
    users.value = []
  }
}
</script>

<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="register-card">
          <h1>Register</h1>

          <form @submit.prevent="handleSubmit" class="form" novalidate>
            <!-- Name -->
            <label class="label">
              <span>Name</span>
              <input
                v-model="formData.name"
                type="text"
                placeholder="Your full name"
                @blur="() => validateName(true)"
                @input="() => validateName(false)"
                :class="{ invalid: !!errors.name }"
              />
              <small id="nameHelp" v-if="errors.name" class="error">{{ errors.name }}</small>
            </label>

            <!-- Email -->
            <label class="label">
              <span>Email</span>
              <input
                v-model="formData.email"
                type="email"
                placeholder="name@example.com"
                @blur="() => validateEmail(true)"
                @input="() => validateEmail(false)"
                :class="{ invalid: !!errors.email }"
              />
              <small id="emailHelp" v-if="errors.email" class="error">{{ errors.email }}</small>
            </label>

            <!-- Password -->
            <label class="label">
              <span>Password</span>
              <input
                v-model="formData.password"
                type="password"
                placeholder="At least 8 characters"
                @blur="
                  () => {
                    validatePassword(true)
                    validateConfirm(true)
                  }
                "
                @input="
                  () => {
                    validatePassword(false)
                    validateConfirm(false)
                  }
                "
                :class="{ invalid: !!errors.password }"
              />
              <small id="passwordHelp" v-if="errors.password" class="error">{{
                errors.password
              }}</small>
            </label>

            <!-- Confirm -->
            <label class="label">
              <span>Confirm Password</span>
              <input
                v-model="formData.confirmPassword"
                type="password"
                placeholder="Re-enter password"
                @blur="() => validateConfirm(true)"
                @input="() => validateConfirm(false)"
                :class="{ invalid: !!errors.confirmPassword }"
              />
              <small id="confirmHelp" v-if="errors.confirmPassword" class="error">{{
                errors.confirmPassword
              }}</small>
            </label>

            <button type="submit" class="btn" :disabled="isDisabled">Create Account</button>
          </form>
        </div>
      </div>
    </div>
    <!-- PrimeVue DataTable -->
    <div class="row mt-5" v-if="users.length">
      <div class="col-12">
        <h4>Registered Users</h4>
        <DataTable :value="users" tableStyle="min-width: 40rem">
          <Column field="name" header="Name" />
          <Column field="email" header="Email" />
          <Column field="password" header="Password" />
          <Column header="Actions">
            <template #body="{ data }">
              <button class="btn btn-sm btn-outline-danger" @click="removeUser(data.id)">
                Delete
              </button>
            </template>
          </Column>
        </DataTable>
      </div>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <button class="btn btn-secondary" @click="clearAll" v-if="users.length">Clear All</button>
      </div>
    </div>
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
