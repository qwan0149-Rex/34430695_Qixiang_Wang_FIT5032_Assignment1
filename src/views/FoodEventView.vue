<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../firebase'
import { authState } from '../auth.js'
import { collection, doc, setDoc, query, where, onSnapshot, getDoc } from 'firebase/firestore'

const router = useRouter()

const foods = ref([
  { id: 'salad', name: 'Fresh Salad' },
  { id: 'soup', name: 'Pumpkin Soup' },
  { id: 'sushi', name: 'Avocado Sushi' },
])

const stats = ref({})
const userScores = ref({})
const loading = ref(false)
const error = ref('')

function listenFoodAggregate(foodId) {
  const q = query(collection(db, 'ratings'), where('foodId', '==', foodId))
  onSnapshot(q, (snap) => {
    let sum = 0,
      n = 0
    snap.forEach((d) => {
      const s = d.data().score
      if (Number.isInteger(s)) {
        sum += s
        n++
      }
    })
    stats.value[foodId] = { avg: n ? sum / n : 0, count: n }
  })
}

async function loadMyScore(foodId) {
  if (!authState.user) return
  const myRef = doc(db, 'ratings', `${foodId}_${authState.user.uid}`)
  const snap = await getDoc(myRef)
  if (snap.exists()) {
    userScores.value[foodId] = snap.data().score
  }
}

const lastSaved = ref(false)
async function rate(foodId) {
  error.value = ''
  lastSaved.value = false
  if (!authState.user) {
    router.push('/login?redirect=/event')
    return
  }
  const score = Number(userScores.value[foodId])
  if (!(score >= 1 && score <= 5)) {
    error.value = 'Please choose a score (1-5).'
    return
  }

  try {
    loading.value = true
    const uid = authState.user.uid
    const ref = doc(db, 'ratings', `${foodId}_${uid}`)
    await setDoc(
      ref,
      {
        userId: uid,
        foodId,
        score,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    )
    lastSaved.value = true
    setTimeout(() => (lastSaved.value = false), 1200)
  } catch (e) {
    error.value = e?.message || 'Failed to submit rating.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  foods.value.forEach((f) => listenFoodAggregate(f.id))

  if (authState.user) {
    for (const f of foods.value) await loadMyScore(f.id)
  }
})
</script>

<template>
  <section class="container py-5">
    <h1 class="h4 mb-4">Healthy Food Challenge</h1>

    <div class="row g-3" style="max-width: 900px">
      <div v-for="f in foods" :key="f.id" class="col-12 col-md-6">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">{{ f.name }}</h5>

            <p class="text-muted mb-2">
              Average: {{ (stats[f.id]?.avg || 0).toFixed(1) }} ({{ stats[f.id]?.count || 0 }}
              votes)
            </p>

            <div class="d-flex align-items-center gap-2">
              <select v-model="userScores[f.id]" class="form-select" style="width: 120px">
                <option disabled value="">Your rating</option>
                <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
              </select>
              <button class="btn btn-primary" :disabled="loading" @click="rate(f.id)">Rate</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="text-danger mt-3">{{ error }}</p>
    <p v-else-if="lastSaved" class="text-success mt-2">Saved!</p>
  </section>
</template>
