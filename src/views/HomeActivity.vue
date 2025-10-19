<!-- src/views/HomeActivity.vue -->
<script setup>
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'

// DATA

// Daily Nutrition Activities
const activities = ref([
  {
    date: '2025-10-01',
    activity: 'Hydration challenge',
    category: 'Hydration',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-01',
    activity: 'Add vegetables to dinner',
    category: 'Balanced diet',
    minutes: null,
    calories: 50,
  },
  {
    date: '2025-10-02',
    activity: 'Lunchtime brisk walk',
    category: 'Exercise',
    minutes: 20,
    calories: 90,
  },
  {
    date: '2025-10-02',
    activity: 'Swap sugary drinks',
    category: 'Reduce sugar',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-03',
    activity: 'High-protein breakfast',
    category: 'Protein',
    minutes: null,
    calories: 250,
  },
  {
    date: '2025-10-03',
    activity: 'Pre-sleep stretching',
    category: 'Exercise',
    minutes: 10,
    calories: 40,
  },
  {
    date: '2025-10-04',
    activity: 'Fruit before lunch',
    category: 'Balanced diet',
    minutes: null,
    calories: 80,
  },
  { date: '2025-10-04', activity: 'Morning jog', category: 'Exercise', minutes: 30, calories: 210 },
  {
    date: '2025-10-05',
    activity: 'Reduce salt & oil',
    category: 'Salt reduction',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-05',
    activity: 'High-fibre lunch',
    category: 'Fibre',
    minutes: null,
    calories: 200,
  },
  {
    date: '2025-10-06',
    activity: 'Evening walk',
    category: 'Exercise',
    minutes: 25,
    calories: 110,
  },
  {
    date: '2025-10-06',
    activity: 'Smart snack: nuts',
    category: 'Balanced diet',
    minutes: null,
    calories: 170,
  },
  {
    date: '2025-10-07',
    activity: 'Sugar-free day',
    category: 'Reduce sugar',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-07',
    activity: 'Mindful eating',
    category: 'Balanced diet',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-08',
    activity: 'Desk stretch break',
    category: 'Exercise',
    minutes: 8,
    calories: 30,
  },
  {
    date: '2025-10-08',
    activity: 'Add legumes to lunch',
    category: 'Protein',
    minutes: null,
    calories: 190,
  },
  {
    date: '2025-10-09',
    activity: 'Whole-grain swap',
    category: 'Balanced diet',
    minutes: null,
    calories: 60,
  },
  {
    date: '2025-10-09',
    activity: 'After-dinner walk',
    category: 'Exercise',
    minutes: 15,
    calories: 70,
  },
  {
    date: '2025-10-10',
    activity: 'Colourful plate',
    category: 'Balanced diet',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-10',
    activity: 'Water before coffee',
    category: 'Hydration',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-11',
    activity: 'Low-sodium choices',
    category: 'Salt reduction',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-11',
    activity: 'Home cooking day',
    category: 'Balanced diet',
    minutes: 45,
    calories: 120,
  },
  {
    date: '2025-10-12',
    activity: 'Morning mobility',
    category: 'Exercise',
    minutes: 12,
    calories: 50,
  },
  {
    date: '2025-10-12',
    activity: 'Add fruit to breakfast',
    category: 'Fibre',
    minutes: null,
    calories: 95,
  },
  {
    date: '2025-10-13',
    activity: 'No late-night snacks',
    category: 'Reduce sugar',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-13',
    activity: 'Protein with each meal',
    category: 'Protein',
    minutes: null,
    calories: 220,
  },
  {
    date: '2025-10-14',
    activity: 'Standing break hourly',
    category: 'Exercise',
    minutes: 10,
    calories: 35,
  },
  {
    date: '2025-10-14',
    activity: 'Salad starter',
    category: 'Balanced diet',
    minutes: null,
    calories: 90,
  },
  {
    date: '2025-10-15',
    activity: 'Herbal tea hydration',
    category: 'Hydration',
    minutes: null,
    calories: null,
  },
  {
    date: '2025-10-15',
    activity: 'Reduce processed foods',
    category: 'Balanced diet',
    minutes: null,
    calories: null,
  },
])

// Healthy Recipes
const recipes = ref([
  { name: 'Tomato Chicken Salad', type: 'Lunch', calories: 320, protein: 28, tag: 'Low-fat' },
  {
    name: 'Overnight Oats & Milk',
    type: 'Breakfast',
    calories: 250,
    protein: 10,
    tag: 'High-fibre',
  },
  {
    name: 'Steamed Pumpkin with Tofu',
    type: 'Dinner',
    calories: 280,
    protein: 20,
    tag: 'Vegetarian',
  },
  { name: 'Beef Veggie Wraps', type: 'Lunch', calories: 450, protein: 35, tag: 'High-protein' },
  { name: 'Stir-fried Broccoli', type: 'Side', calories: 150, protein: 6, tag: 'High-fibre' },
  { name: 'Multigrain Rice', type: 'Staple', calories: 200, protein: 8, tag: 'Whole-grain' },
  { name: 'Egg & Tofu Soup', type: 'Soup', calories: 180, protein: 12, tag: 'Low-fat' },
  { name: 'Fruit Salad Cup', type: 'Snack', calories: 140, protein: 3, tag: 'Vitamins' },
  { name: 'Veggie Omelette', type: 'Breakfast', calories: 290, protein: 15, tag: 'High-protein' },
  {
    name: 'Soy Milk Oat Porridge',
    type: 'Breakfast',
    calories: 230,
    protein: 9,
    tag: 'High-fibre',
  },
  { name: 'Chickpea Salad', type: 'Side', calories: 260, protein: 12, tag: 'Vegetarian' },
  { name: 'Grilled Salmon Bowl', type: 'Dinner', calories: 420, protein: 34, tag: 'Omega-3' },
  { name: 'Quinoa Veggie Bowl', type: 'Lunch', calories: 360, protein: 14, tag: 'Whole-grain' },
  { name: 'Greek Yogurt Parfait', type: 'Snack', calories: 200, protein: 11, tag: 'Low-fat' },
  {
    name: 'Chicken & Avocado Wrap',
    type: 'Lunch',
    calories: 430,
    protein: 31,
    tag: 'High-protein',
  },
  {
    name: 'Tofu Stir-fry with Greens',
    type: 'Dinner',
    calories: 300,
    protein: 18,
    tag: 'Vegetarian',
  },
  { name: 'Lentil Soup', type: 'Soup', calories: 240, protein: 16, tag: 'High-fibre' },
  { name: 'Baked Sweet Potato', type: 'Side', calories: 190, protein: 4, tag: 'Vitamins' },
  { name: 'Turkey Salad Sandwich', type: 'Lunch', calories: 350, protein: 27, tag: 'High-protein' },
  { name: 'Oven-roasted Veg Medley', type: 'Side', calories: 170, protein: 5, tag: 'High-fibre' },
  { name: 'Shrimp & Brown Rice', type: 'Dinner', calories: 460, protein: 33, tag: 'Whole-grain' },
  { name: 'Spinach Egg Muffins', type: 'Breakfast', calories: 260, protein: 17, tag: 'Low-carb' },
  { name: 'Miso Tofu Bowl', type: 'Lunch', calories: 310, protein: 19, tag: 'Vegetarian' },
  { name: 'Barley Mushroom Soup', type: 'Soup', calories: 210, protein: 8, tag: 'Whole-grain' },
  {
    name: 'Apple Peanut Butter Bites',
    type: 'Snack',
    calories: 180,
    protein: 6,
    tag: 'Healthy-fat',
  },
  {
    name: 'Cottage Cheese & Berries',
    type: 'Snack',
    calories: 190,
    protein: 16,
    tag: 'High-protein',
  },
  { name: 'Egg Fried Brown Rice', type: 'Lunch', calories: 410, protein: 21, tag: 'Whole-grain' },
  { name: 'Tofu & Mushroom Pasta', type: 'Dinner', calories: 390, protein: 22, tag: 'Vegetarian' },
  { name: 'Avocado Tuna Salad', type: 'Lunch', calories: 370, protein: 29, tag: 'Healthy-fat' },
  { name: 'Roasted Chickpeas', type: 'Snack', calories: 160, protein: 7, tag: 'High-fibre' },
])

// FILTERS

const activityFilters = ref({
  global: { value: null, matchMode: 'contains' },
  date: { value: null, matchMode: 'contains' },
  activity: { value: null, matchMode: 'contains' },
  category: { value: null, matchMode: 'contains' },
  minutes: { value: null, matchMode: 'equals' },
  calories: { value: null, matchMode: 'equals' },
})
const recipeFilters = ref({
  global: { value: null, matchMode: 'contains' },
  name: { value: null, matchMode: 'contains' },
  type: { value: null, matchMode: 'contains' },
  calories: { value: null, matchMode: 'equals' },
  protein: { value: null, matchMode: 'equals' },
  tag: { value: null, matchMode: 'contains' },
})

// SORT HELPERS

function getNum(x) {
  if (x === null || x === undefined || x === '-') return null
  const n = Number(x)
  return Number.isNaN(n) ? null : n
}
function numericNullLastSort(event, field) {
  const { data, order } = event
  data.sort((a, b) => {
    const av = getNum(a[field]),
      bv = getNum(b[field])
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1
    return order * (av - bv)
  })
}
function dateSort(event, field) {
  const { data, order } = event
  data.sort((a, b) => {
    const ad = new Date(a[field]),
      bd = new Date(b[field])
    if (isNaN(ad) && isNaN(bd)) return 0
    if (isNaN(ad)) return 1
    if (isNaN(bd)) return -1
    return order * (ad - bd)
  })
}
function dash(v) {
  return v === null || v === undefined ? '-' : v
}

// PDF EXPORT with counting

const fmt = (v) => (v === null || v === undefined || v === '' ? '-' : v)

async function exportPDF(rows, columns, title, filename) {
  if (!rows || !rows.length) return
  const docPDF = new jsPDF('p', 'pt', 'a4')
  docPDF.setFontSize(14)
  docPDF.text(title, 40, 40)
  autoTable(docPDF, {
    startY: 60,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => fmt(r[c.key]))),
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [33, 150, 243] },
    margin: { left: 40, right: 40 },
  })
  docPDF.save(filename)

  try {
    await updateDoc(doc(db, 'stats', 'global'), { csvExports: increment(1) })
  } catch (e) {
    console.warn('Failed to bump csvExports (PDF):', e?.message)
  }
}

// CSV EXPORT with counting

async function exportCSV(data, filename) {
  if (!data?.length) return
  const keys = Object.keys(data[0])
  const header = keys.join(',')
  const body = data
    .map((r) =>
      keys
        .map((k) => {
          const v = r[k]
          const s = Array.isArray(v) ? v.join('|') : (v ?? '')
          return `"${String(s).replace(/"/g, '""')}"`
        })
        .join(','),
    )
    .join('\n')
  const csv = header + '\n' + body
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)

  try {
    await updateDoc(doc(db, 'stats', 'global'), { csvExports: increment(1) })
  } catch (e) {
    console.warn('Failed to bump csvExports (CSV):', e?.message)
  }
}

const activityCols = [
  { key: 'date', header: 'Date' },
  { key: 'activity', header: 'Activity' },
  { key: 'category', header: 'Category' },
  { key: 'minutes', header: 'Minutes' },
  { key: 'calories', header: 'Calories (kcal)' },
]
const recipeCols = [
  { key: 'name', header: 'Recipe' },
  { key: 'type', header: 'Type' },
  { key: 'tag', header: 'Tag' },
  { key: 'calories', header: 'Calories (kcal)' },
  { key: 'protein', header: 'Protein (g)' },
]

const exportActivities = () => exportCSV(activities.value, 'daily_activities.csv')
const exportRecipes = () => exportCSV(recipes.value, 'healthy_recipes.csv')
const exportActivitiesPDF = () =>
  exportPDF(activities.value, activityCols, 'Daily Nutrition Activities', 'daily_activities.pdf')
const exportRecipesPDF = () =>
  exportPDF(recipes.value, recipeCols, 'Healthy Recipes', 'healthy_recipes.pdf')
</script>

<template>
  <section class="nutrition-section py-5">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="fw-bold mb-2">Daily Nutrition & Healthy Recipes</h2>
        <p class="text-muted">
          Stay motivated with small daily activities and explore delicious, nutritious recipes.
        </p>
        <hr class="w-50 mx-auto my-4" />
      </div>

      <!-- Activities -->
      <div class="nutrition-card shadow-sm p-4 mb-5 bg-white rounded">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 class="fw-semibold mb-0">🥗 Daily Nutrition Activities</h5>
            <small class="text-muted">Track your daily habits for better health</small>
          </div>
          <div class="d-flex gap-2 align-items-center">
            <InputText
              v-model="activityFilters['global'].value"
              placeholder="Search activities..."
              class="p-inputtext-sm"
            />
            <button class="btn btn-primary btn-sm" @click="exportActivities">Export CSV</button>
            <button
              class="btn btn-primary btn-sm"
              style="background-color: #0d6efd; border-color: #0d6efd"
              @click="exportActivitiesPDF"
            >
              Export PDF
            </button>
          </div>
        </div>

        <DataTable
          sortField="date"
          :sortOrder="-1"
          :value="activities"
          paginator
          :rows="10"
          stripedRows
          responsiveLayout="scroll"
          filterDisplay="row"
          v-model:filters="activityFilters"
          :globalFilterFields="['date', 'activity', 'category', 'minutes', 'calories']"
        >
          <Column
            field="date"
            header="Date"
            :sortable="true"
            :sortFunction="(e) => dateSort(e, 'date')"
            filter
            filterPlaceholder="YYYY-MM-DD"
          />
          <Column
            field="activity"
            header="Activity"
            :sortable="false"
            filter
            filterPlaceholder="e.g., walk"
          />
          <Column
            field="category"
            header="Category"
            :sortable="false"
            filter
            filterPlaceholder="Hydration/Exercise/..."
          />
          <Column
            field="minutes"
            header="Minutes"
            :sortable="true"
            :sortFunction="(e) => numericNullLastSort(e, 'minutes')"
            filter
          >
            <template #body="{ data }">{{ dash(data.minutes) }}</template>
          </Column>
          <Column
            field="calories"
            header="Calories (kcal)"
            :sortable="true"
            :sortFunction="(e) => numericNullLastSort(e, 'calories')"
            filter
          >
            <template #body="{ data }">{{ dash(data.calories) }}</template>
          </Column>
        </DataTable>
      </div>

      <!-- Recipes -->
      <div class="nutrition-card shadow-sm p-4 bg-white rounded">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 class="fw-semibold mb-0">🍴 Healthy Recipes</h5>
            <small class="text-muted">Find inspiration for your next healthy meal</small>
          </div>
          <div class="d-flex gap-2 align-items-center">
            <InputText
              v-model="recipeFilters['global'].value"
              placeholder="Search recipes..."
              class="p-inputtext-sm"
            />
            <button class="btn btn-primary btn-sm" @click="exportRecipes">Export CSV</button>
            <button
              class="btn btn-primary btn-sm"
              style="background-color: #0d6efd; border-color: #0d6efd"
              @click="exportRecipesPDF"
            >
              Export PDF
            </button>
          </div>
        </div>

        <DataTable
          :value="recipes"
          paginator
          :rows="10"
          stripedRows
          responsiveLayout="scroll"
          filterDisplay="row"
          v-model:filters="recipeFilters"
          :globalFilterFields="['name', 'type', 'calories', 'protein', 'tag']"
        >
          <Column
            field="name"
            header="Recipe"
            :sortable="false"
            filter
            filterPlaceholder="name..."
          />
          <Column
            field="type"
            header="Type"
            :sortable="false"
            filter
            filterPlaceholder="Breakfast/Lunch/..."
          />
          <Column
            field="tag"
            header="Tag"
            :sortable="false"
            filter
            filterPlaceholder="Low-fat/Vegetarian/..."
          />
          <Column
            field="calories"
            header="Calories (kcal)"
            :sortable="true"
            :sortFunction="(e) => numericNullLastSort(e, 'calories')"
            filter
          />
          <Column
            field="protein"
            header="Protein (g)"
            :sortable="true"
            :sortFunction="(e) => numericNullLastSort(e, 'protein')"
            filter
          />
        </DataTable>
      </div>
    </div>
  </section>
</template>

<style scoped>
.nutrition-section {
  background-color: #f9fafb;
}
.nutrition-card {
  transition: box-shadow 0.3s ease;
}
.nutrition-card:hover {
  box-shadow: 0 4px 16px rgba(78, 73, 73, 0.08);
}
.container {
  max-width: 1100px;
  margin: 0 auto;
}
.p-inputtext-sm {
  width: 200px;
}
</style>
