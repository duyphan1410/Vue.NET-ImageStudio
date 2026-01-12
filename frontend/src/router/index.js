import { createRouter, createWebHistory } from 'vue-router'
import RemoveBgView from '@/views/RemoveBgView.vue'
import PaintImage from '@/views/PaintImage.vue'
import EditorView from '@/views/EditorView.vue'
import AdjustImage from '@/components/AdjustImage.vue'

const routes = [
  {
    path: '/',
    name: 'EditorView',
    component: EditorView,
  },
  {
    path: '/remove-bg',
    name: 'RemoveBg',
    component: RemoveBgView,
  },
  {
    path: '/paint-image',
    name: 'PaintImage',
    component: PaintImage,
  },
  { path: '/adjust-image',
    name: 'AdjustImage', 
    component: AdjustImage 
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
