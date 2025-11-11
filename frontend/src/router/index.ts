import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import GameView from '../views/GameView.vue';
import CharacterCreatorView from '../views/CharacterCreatorView.vue';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/game/:world?', name: 'game', component: GameView },
  { path: '/character/:world?', name: 'character', component: CharacterCreatorView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
