import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import UserHub from '../views/UserHub.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/user', component: UserHub },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/dashboard', component: DashboardView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active',
})
