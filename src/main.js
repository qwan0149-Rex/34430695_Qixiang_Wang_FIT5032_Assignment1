import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import router from './router/index.js'
import { initAuth } from './auth.js'

const app = createApp(App)
app.use(PrimeVue, { theme: { preset: Aura } })

initAuth()
createApp(App).use(router).mount('#app')
