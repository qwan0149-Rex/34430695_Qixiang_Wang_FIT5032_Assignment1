import { createRouter, createWebHistory } from 'vue-router'
import { authState } from '../auth.js'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import UserHub from '../views/UserHub.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/user', component: UserHub, meta: { guestOnly: true } },
  { path: '/login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', component: RegisterView, meta: { guestOnly: true } },

  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },

  { path: '/admin', component: AdminView, meta: { requiresAuth: true, role: 'admin' } },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active',
})

function waitForAuthReady() {
  if (authState.ready) return Promise.resolve()
  return new Promise((resolve) => {
    const t = setInterval(() => {
      if (authState.ready) {
        clearInterval(t)
        resolve()
      }
    }, 20)
  })
}

router.beforeEach(async (to) => {
  await waitForAuthReady()

  if (to.meta?.guestOnly && authState.user) {
    return { path: '/dashboard' }
  }

  if (to.meta?.requiresAuth && !authState.user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta?.role && authState.role !== to.meta.role) {
    return { path: '/dashboard' }
  }

  return true
})

export default router
