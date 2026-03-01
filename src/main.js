import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { fmBootstrap } from '@/fm'

fmBootstrap({ readyScript: 'JS My App Load' })

createApp(App).mount('#app')
