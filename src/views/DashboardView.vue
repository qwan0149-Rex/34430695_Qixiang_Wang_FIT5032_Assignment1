<script setup>
import { ref, computed, watch } from 'vue'
import { authState } from '../auth.js'
import { getApp } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'

const displayName = computed(
  () => authState.user?.displayName || authState.user?.email?.split('@')[0] || 'User',
)

const app = getApp()
const functions = getFunctions(app, 'australia-southeast1')
const calculateBMI = httpsCallable(functions, 'calculateBMI')

const height = ref('')
const weight = ref('')
const loading = ref(false)
const msg = ref('')
const bmi = ref(null)
const category = ref('')
const error = ref('')

const canCalc = computed(() => {
  const h = Number(height.value)
  const w = Number(weight.value)
  return h > 0 && w > 0 && Number.isFinite(h) && Number.isFinite(w)
})

watch([height, weight], () => {
  msg.value = ''
  bmi.value = null
  category.value = ''
  error.value = ''
})

async function calcBMI() {
  if (!canCalc.value) {
    error.value = 'Please enter valid height (cm) and weight (kg).'
    return
  }
  try {
    loading.value = true
    error.value = ''
    const res = await calculateBMI({
      height: Number(height.value),
      weight: Number(weight.value),
    })
    msg.value = res?.data?.message || ''
    bmi.value = res?.data?.bmi ?? null
    category.value = res?.data?.category || ''
  } catch (e) {
    console.error(e)
    error.value = 'Error calculating BMI. Please try again.'
  } finally {
    loading.value = false
  }
}

function badgeClass(cat) {
  switch (cat) {
    case 'Underweight':
      return 'badge bg-warning text-dark'
    case 'Normal weight':
      return 'badge bg-success'
    case 'Overweight':
      return 'badge bg-orange text-dark'
    case 'Obese':
      return 'badge bg-danger'
    default:
      return 'badge bg-secondary'
  }
}
</script>

<template>
  <section class="container py-5" style="max-width: 720px">
    <h1 class="h4">Dashboard</h1>
    <p>Welcome! {{ displayName }}！</p>

    <div class="card p-4 shadow-sm mt-3">
      <h5 class="mb-3">💪 BMI Calculator</h5>

      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Height (cm)</label>
          <input
            v-model="height"
            type="number"
            class="form-control"
            placeholder="e.g. 170"
            min="1"
            step="0.1"
            @keyup.enter="calcBMI"
          />
        </div>
        <div class="col-md-6">
          <label class="form-label">Weight (kg)</label>
          <input
            v-model="weight"
            type="number"
            class="form-control"
            placeholder="e.g. 65"
            min="1"
            step="0.1"
            @keyup.enter="calcBMI"
          />
        </div>
      </div>

      <button class="btn btn-primary w-100 mt-3" :disabled="!canCalc || loading" @click="calcBMI">
        {{ loading ? 'Calculating…' : 'Calculate BMI' }}
      </button>

      <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>

      <div
        v-if="msg"
        class="alert alert-info mt-3 d-flex justify-content-between align-items-center"
      >
        <span>
          {{ msg }}
          <template v-if="bmi">
            (BMI: <strong>{{ bmi }}</strong
            >)</template
          >
        </span>
        <span :class="badgeClass(category)">{{ category }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bg-orange {
  background-color: #ffd08a !important;
}
</style>
