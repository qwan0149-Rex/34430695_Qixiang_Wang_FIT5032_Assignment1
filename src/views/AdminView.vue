<!-- src/views/AdminView.vue -->
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { authState } from '../auth.js'
import { db } from '../firebase'
import {
  collection,
  doc,
  onSnapshot as docSnap,
  onSnapshot,
  getCountFromServer,
  query,
  where,
} from 'firebase/firestore'
import { updateDoc, setDoc } from 'firebase/firestore'

const displayName = computed(
  () => authState.user?.displayName || authState.user?.email?.split('@')[0] || 'User',
)

const kpis = reactive({
  emailsSent: 0,
  mapSearches: 0,
  csvExports: 0,
  usersTotalDoc: 0,
})

const roleCounts = reactive({
  total: 0,
  admin: 0,
  user: 0,
})

async function refreshRoleCounts() {
  roleCounts.total = (await getCountFromServer(collection(db, 'users'))).data().count

  roleCounts.admin = (
    await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin')))
  ).data().count

  roleCounts.user = (
    await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'user')))
  ).data().count

  await syncUsersTotalDoc()
  await updateDoc(doc(db, 'stats', 'global'), {
    usersTotal: roleCounts.total,
    roleCounts: { admin: roleCounts.admin, user: roleCounts.user },
  })
}

async function syncUsersTotalDoc() {
  try {
    if (kpis.usersTotalDoc !== roleCounts.total) {
      await updateDoc(doc(db, 'stats', 'global'), {
        usersTotal: roleCounts.total,
      })
      kpis.usersTotalDoc = roleCounts.total
    }
  } catch (e) {
    await setDoc(doc(db, 'stats', 'global'), { usersTotal: roleCounts.total }, { merge: true })
    kpis.usersTotalDoc = roleCounts.total
  }
}

const lastUpdated = ref('')

onMounted(() => {
  const unsubStats = docSnap(doc(db, 'stats', 'global'), (snap) => {
    if (snap.exists()) {
      const d = snap.data() || {}
      kpis.emailsSent = d.emailsSent || 0
      kpis.mapSearches = d.mapSearches || 0
      kpis.csvExports = d.csvExports || 0
      kpis.usersTotalDoc = d.usersTotal || 0
      lastUpdated.value = new Date().toLocaleString()
    }
  })

  const unsubUsers = onSnapshot(collection(db, 'users'), () => {
    refreshRoleCounts()
  })

  refreshRoleCounts()

  onUnmounted(() => {
    unsubStats()
    unsubUsers()
  })
})
</script>

<template>
  <section class="container py-5">
    <h1 class="h4">Admin Dashboard</h1>
    <p class="mb-4">Welcome! {{ displayName }}.</p>

    <div class="row g-3">
      <div class="col-12 col-md-3">
        <div class="card text-center h-100">
          <div class="card-body">
            <h6 class="card-title">Total Users</h6>
            <p class="display-6 mb-0">{{ roleCounts.total }}</p>
            <small class="text-muted">from users collection</small>
          </div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="card text-center h-100">
          <div class="card-body">
            <h6 class="card-title">Admins</h6>
            <p class="display-6 mb-0">{{ roleCounts.admin }}</p>
          </div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="card text-center h-100">
          <div class="card-body">
            <h6 class="card-title">Users</h6>
            <p class="display-6 mb-0">{{ roleCounts.user }}</p>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-3">
        <div class="card text-center h-100">
          <div class="card-body">
            <h6 class="card-title">Emails Sent</h6>
            <p class="display-6 mb-0">{{ kpis.emailsSent }}</p>
          </div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="card text-center h-100">
          <div class="card-body">
            <h6 class="card-title">Map Searches</h6>
            <p class="display-6 mb-0">{{ kpis.mapSearches }}</p>
          </div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="card text-center h-100">
          <div class="card-body">
            <h6 class="card-title">CSV & PDF Exports</h6>
            <p class="display-6 mb-0">{{ kpis.csvExports }}</p>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-3">
        <div class="card text-center h-100">
          <div class="card-body">
            <h6 class="card-title">Users Total (doc)</h6>
            <p class="display-6 mb-0">{{ kpis.usersTotalDoc }}</p>
            <small class="text-muted">from stats/global</small>
          </div>
        </div>
      </div>
    </div>

    <p class="text-muted mt-3" v-if="lastUpdated">Last updated: {{ lastUpdated }}</p>

    <RouterLink to="/email" class="btn btn-primary mt-4" aria-label="Open Email Center">
      Open Email Center
    </RouterLink>
  </section>
</template>

<style scoped>
.card-title {
  margin-bottom: 0.25rem;
  font-weight: 600;
}
.display-6 {
  font-size: 2rem;
  font-weight: 700;
}
</style>
