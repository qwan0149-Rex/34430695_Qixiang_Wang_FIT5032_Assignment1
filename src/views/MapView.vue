<template>
  <div class="page">
    <aside class="sidebar">
      <h2>Nearby Search</h2>

      <div class="search-type">
        <label for="type">Select type:</label>
        <select
          id="type"
          v-model="searchType"
          class="input"
          aria-label="Select place type to search"
        >
          <option value="food">Restaurants / Cafes</option>
          <option value="gym">Gyms</option>
        </select>
      </div>

      <div class="controls">
        <button class="btn primary" @click="locateMe" aria-label="Locate my position">
          Locate Me
        </button>
        <button class="btn" @click="findNearby" :disabled="loading" aria-label="Find nearby places">
          {{ loading ? 'Searching...' : 'Find Nearby' }}
        </button>
        <button class="btn ghost" @click="clearAll" aria-label="Clear markers and route">
          Clear
        </button>
      </div>

      <p class="hint">
        This version uses OpenStreetMap (Overpass API). Pan/zoom the map, then click
        <b>Find Nearby</b>.
      </p>

      <div class="list" v-if="places.length">
        <div class="item" v-for="(p, idx) in places" :key="idx">
          <div class="title">{{ p.name || 'Unnamed' }}</div>
          <div class="sub">{{ p.type }} • {{ p.lat.toFixed(5) }}, {{ p.lon.toFixed(5) }}</div>
          <div class="actions">
            <button class="btn sm" @click="focus(p)" aria-label="Focus on place">Focus</button>
            <button class="btn sm" @click="showRouteTo(p)" aria-label="Show walking route to place">
              Route
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty">No results yet.</div>
    </aside>

    <main class="map-wrap">
      <div ref="mapEl" class="map" role="region" aria-label="Interactive map"></div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'

//  state
const searchType = ref('food')
const mapEl = ref(null)
const map = ref(null)
const me = ref(null)
const gymMarkers = ref([])
const foodMarkers = ref([])
const places = ref([])
const loading = ref(false)

let routeLine = null
let routePopup = null

//init
onMounted(() => {
  map.value = L.map(mapEl.value, { zoomControl: true }).setView([-37.8136, 144.9631], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map.value)
})

onBeforeUnmount(() => {
  map.value?.remove()
})

// locate me
function locateMe() {
  if (!map.value) return
  if (!('geolocation' in navigator)) {
    map.value.setView([-37.8136, 144.9631], 13)
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      if (me.value) me.value.remove()
      me.value = L.circleMarker([lat, lon], {
        radius: 8,
        color: '#22c55e',
        weight: 2,
        fillColor: '#86efac',
        fillOpacity: 0.8,
      })
        .addTo(map.value)
        .bindPopup('You are here')
      map.value.setView([lat, lon], 15)
    },
    () => map.value.setView([-37.8136, 144.9631], 13),
    { enableHighAccuracy: true, timeout: 7000 },
  )
}

//  build overpass query
function buildOverpassQuery() {
  const b = map.value.getBounds()
  const s = b.getSouth(),
    w = b.getWest(),
    n = b.getNorth(),
    e = b.getEast()

  if (searchType.value === 'food') {
    return `
      [out:json][timeout:25];
      (
        node["amenity"="restaurant"](${s},${w},${n},${e});
        node["amenity"="cafe"](${s},${w},${n},${e});
        node["amenity"="fast_food"](${s},${w},${n},${e});
        way["amenity"="restaurant"](${s},${w},${n},${e});
        way["amenity"="cafe"](${s},${w},${n},${e});
        way["amenity"="fast_food"](${s},${w},${n},${e});
        relation["amenity"="restaurant"](${s},${w},${n},${e});
        relation["amenity"="cafe"](${s},${w},${n},${e});
        relation["amenity"="fast_food"](${s},${w},${n},${e});
      );
      out center 60;
    `
  } else {
    // gyms
    return `
      [out:json][timeout:25];
      (
        node["leisure"="fitness_centre"](${s},${w},${n},${e});
        node["amenity"="fitness_centre"](${s},${w},${n},${e});
        node["amenity"="gym"](${s},${w},${n},${e});
        node["sport"="fitness"](${s},${w},${n},${e});

        way["leisure"="fitness_centre"](${s},${w},${n},${e});
        way["amenity"="fitness_centre"](${s},${w},${n},${e});
        way["amenity"="gym"](${s},${w},${n},${e});
        way["sport"="fitness"](${s},${w},${n},${e});

        relation["leisure"="fitness_centre"](${s},${w},${n},${e});
        relation["amenity"="fitness_centre"](${s},${w},${n},${e});
        relation["amenity"="gym"](${s},${w},${n},${e});
        relation["sport"="fitness"](${s},${w},${n},${e});
      );
      out center 60;
    `
  }
}

// helpers to clear
function clearRoute() {
  if (routeLine) {
    routeLine.remove()
    routeLine = null
  }
  if (routePopup) {
    try {
      map.value?.closePopup(routePopup)
    } catch (_) {}
    routePopup = null
  }
}

function clearPOIs() {
  gymMarkers.value.forEach((m) => m.remove())
  foodMarkers.value.forEach((m) => m.remove())
  gymMarkers.value = []
  foodMarkers.value = []
  places.value = []
}

function clearAll() {
  clearPOIs()
  clearRoute()
  if (me.value) {
    me.value.remove()
    me.value = null
  }
}

//nearby search
async function findNearby() {
  if (!map.value) return
  loading.value = true
  clearPOIs()
  clearRoute()

  try {
    const query = buildOverpassQuery()
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: 'data=' + encodeURIComponent(query),
    })
    const data = await res.json()
    const elements = Array.isArray(data?.elements) ? data.elements : []

    const gyms = []
    const foods = []

    for (const el of elements) {
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (lat == null || lon == null) continue

      const tags = el.tags || {}
      const name = tags.name || tags['name:en'] || ''
      const isGym =
        tags.leisure === 'fitness_centre' ||
        tags.amenity === 'fitness_centre' ||
        tags.amenity === 'gym' ||
        tags.sport === 'fitness'
      const isFood =
        tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food'

      if (isGym) {
        gyms.push({ name, type: 'Gym', lat, lon })
      } else if (isFood) {
        foods.push({
          name,
          type:
            tags.amenity === 'cafe'
              ? 'Cafe'
              : tags.amenity === 'fast_food'
                ? 'Fast food'
                : 'Restaurant',
          lat,
          lon,
        })
      }
    }

    // draw markers
    gyms.forEach((p) => {
      const m = L.circleMarker([p.lat, p.lon], {
        radius: 7,
        color: '#1d4ed8',
        weight: 2,
        fillColor: '#93c5fd',
        fillOpacity: 0.85,
      })
        .addTo(map.value)
        .bindPopup(`<b>${p.name || 'Gym'}</b><br/>${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`)
      gymMarkers.value.push(m)
    })
    foods.forEach((p) => {
      const m = L.circleMarker([p.lat, p.lon], {
        radius: 7,
        color: '#f97316',
        weight: 2,
        fillColor: '#fdba74',
        fillOpacity: 0.85,
      })
        .addTo(map.value)
        .bindPopup(`<b>${p.name || 'Restaurant'}</b><br/>${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`)
      foodMarkers.value.push(m)
    })

    places.value = [...gyms, ...foods]
    if (places.value.length) {
      const group = L.featureGroup([...gymMarkers.value, ...foodMarkers.value])
      map.value.fitBounds(group.getBounds().pad(0.2), { maxZoom: 17 })
    } else {
      console.warn('No POIs found. Try zooming in or pan to the CBD.')
    }

    await updateDoc(doc(db, 'stats', 'global'), {
      mapSearches: increment(1),
    })
  } catch (err) {
    console.error('Overpass error:', err)
    alert('Search failed (Overpass). Please try again or wait a moment.')
  } finally {
    loading.value = false
  }
}

//  focus & route
function focus(p) {
  map.value.setView([p.lat, p.lon], 17)
}

async function showRouteTo(p) {
  if (!me.value) {
    alert("Please click 'Locate Me' first to get your current position.")
    return
  }

  clearRoute()

  const [startLat, startLon] = [me.value.getLatLng().lat, me.value.getLatLng().lng]
  const [endLat, endLon] = [p.lat, p.lon]
  const url = `https://router.project-osrm.org/route/v1/foot/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`

  try {
    const res = await fetch(url)
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route) {
      alert('No route found.')
      return
    }

    const distance = (route.distance / 1000).toFixed(2)
    const duration = (route.duration / 60).toFixed(1)

    routeLine = L.geoJSON(route.geometry, {
      style: { color: '#2563eb', weight: 4, opacity: 0.9 },
    }).addTo(map.value)

    routePopup = L.popup()
      .setLatLng([p.lat, p.lon])
      .setContent(`<b>${p.name || 'Destination'}</b><br>${distance} km • ${duration} min (walk)`)
      .openOn(map.value)

    const bounds = L.latLngBounds([
      [startLat, startLon],
      [endLat, endLon],
    ])
    map.value.fitBounds(bounds, { padding: [50, 50] })
  } catch (err) {
    console.error('Routing error:', err)
    alert('Failed to get route (OSRM). Try again later.')
  }
}
</script>

<style scoped>
.search-type {
  margin-bottom: 10px;
}
.input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.page {
  display: grid;
  grid-template-columns: 320px 1fr;
  height: calc(100vh - 64px);
  background: #fff;
}
.sidebar {
  border-right: 1px solid #e5e7eb;
  padding: 12px;
  overflow: auto;
}
.controls {
  display: grid;
  gap: 8px;
  margin-bottom: 8px;
}
.hint {
  font-size: 12px;
  opacity: 0.7;
}
.list {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}
.item {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 8px;
}
.title {
  font-weight: 700;
}
.sub {
  font-size: 12px;
  opacity: 0.75;
}
.empty {
  opacity: 0.6;
  font-size: 13px;
  margin-top: 10px;
}

.map-wrap {
  position: relative;
}
.map {
  width: 100%;
  height: 100%;
}

.btn {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  cursor: pointer;
}
.btn.primary {
  background: #1d4ed8;
  border-color: #1e40af;
  color: #fff;
}
.btn.ghost {
  background: #f1f5f9;
}
.btn.sm {
  padding: 5px 8px;
  font-size: 12px;
}
</style>
