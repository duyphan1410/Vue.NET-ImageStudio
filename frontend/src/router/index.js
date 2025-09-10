import { createRouter, createWebHistory } from 'vue-router';
import RemoveBgView from '@/components/RemoveBgView.vue';
import PaintImage from '@/views/PaintImage.vue';
import HelloWorld from '@/components/HelloWorld.vue';
import HomeView from '@/views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/Hello',
    name: 'Hello',
    component: HelloWorld,
  },
  {
    path: '/remove-bg',
    name: 'RemoveBg',
    component: RemoveBgView,
  },
  {
    path: '/paint-image',
    name: 'PaingtImage',
    component: PaintImage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;