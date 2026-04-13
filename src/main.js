import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { fmBootstrap } from '@/fm'

fmBootstrap()

createApp(App).mount('#app')
