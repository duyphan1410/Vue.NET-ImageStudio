import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import VueKonva from 'vue-konva'
import { setupFabric } from '@/lib/fabric/setup';
import { vAutofocus } from "@/directives/vAutofocus"

setupFabric();

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueKonva)
app.directive('autofocus', vAutofocus); 
app.mount('#app')
