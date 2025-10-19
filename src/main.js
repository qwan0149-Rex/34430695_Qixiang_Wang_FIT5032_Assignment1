import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'

import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'
import Aura from '@primeuix/themes/aura'

import router from './router/index.js'
import { initAuth } from './auth.js'

initAuth()

const app = createApp(App)
app.use(router)
app.use(PrimeVue, { theme: { preset: Aura } })
app.mount('#app')
