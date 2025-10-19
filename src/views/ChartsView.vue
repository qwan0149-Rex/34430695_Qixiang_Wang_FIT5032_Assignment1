<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { getFirestore, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { Timestamp } from 'firebase/firestore'

Chart.register(
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  TimeScale,
)

const db = getFirestore()

const range = ref(30)
const unsubRef = ref(null)

const usersRaw = ref([])

async function subscribe() {
  if (unsubRef.value) {
    unsubRef.value()
    unsubRef.value = null
  }
  const start = new Date()
  start.setDate(start.getDate() - range.value)

  const q = query(
    collection(db, 'users'),
    where('createdAt', '>=', Timestamp.fromDate(start)),
    orderBy('createdAt', 'asc'),
  )
  unsubRef.value = onSnapshot(q, (snap) => {
    usersRaw.value = snap.docs.map((d) => {
      const x = d.data() || {}
      return {
        createdAt: x.createdAt?.toDate?.() || new Date(),
        role: (x.role || 'user') + '',
      }
    })
  })
}

onMounted(subscribe)
onBeforeUnmount(() => {
  if (unsubRef.value) unsubRef.value()
})
watch(range, subscribe)

const dailySeries = computed(() => {
  const m = new Map()
  usersRaw.value.forEach((u) => {
    const d = new Date(u.createdAt)
    d.setHours(0, 0, 0, 0)
    const key = d.getTime()
    m.set(key, (m.get(key) || 0) + 1)
  })

  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - range.value + 1)
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.getTime()
    days.push({ x: new Date(key), y: m.get(key) || 0 })
  }
  return days
})

const roleSeries = computed(() => {
  const c = new Map()
  usersRaw.value.forEach((u) => c.set(u.role, (c.get(u.role) || 0) + 1))
  const labels = [...c.keys()]
  const values = labels.map((k) => c.get(k))
  return { labels, values }
})

const lineData = computed(() => ({
  datasets: [
    {
      label: 'Daily Sign-ups',
      data: dailySeries.value,
      tension: 0.25,
      fill: true,
    },
  ],
}))
const lineOpts = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  parsing: false,
  scales: {
    x: { type: 'time', time: { unit: range.value <= 30 ? 'day' : 'week' } },
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
  plugins: {
    tooltip: { mode: 'index', intersect: false },
    legend: { position: 'top' },
  },
}))

const barData = computed(() => ({
  labels: roleSeries.value.labels,
  datasets: [{ label: 'Users by Role', data: roleSeries.value.values }],
}))
const barOpts = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  plugins: { legend: { position: 'top' } },
}
</script>

<template>
  <section class="container py-4">
    <h2 class="mb-3">Interactive Charts (Firestore)</h2>

    <div class="d-flex align-items-center gap-2 mb-3">
      <span class="text-muted">Range:</span>
      <select class="form-select" style="width: 140px" v-model.number="range">
        <option :value="7">Last 7 days</option>
        <option :value="30">Last 30 days</option>
        <option :value="90">Last 90 days</option>
      </select>
      <small class="text-muted">Hover to see exact values. Click legend to toggle datasets.</small>
    </div>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header">Daily User Sign-ups</div>
          <div class="card-body" style="height: 340px">
            <Line :data="lineData" :options="lineOpts" />
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">Role Distribution</div>
          <div class="card-body" style="height: 340px">
            <Bar :data="barData" :options="barOpts" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
