import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import GameView from "../views/GameView.vue";
import CharacterCreatorView from "../views/CharacterCreatorView.vue";
import CharacterLevelupView from "../views/CharacterLevelupView.vue";
import NotFoundView from "../views/NotFoundView.vue";
import LoginView from "../views/LoginView.vue";
import AuthCallbackView from "../views/AuthCallbackView.vue";
import { authService } from "../services/authService";

const routes = [
  { path: "/login", name: "login", component: LoginView, meta: { public: true } },
  { path: "/auth/callback", name: "auth-callback", component: AuthCallbackView, meta: { public: true } },
  { path: "/", name: "home", component: HomeView },
  { path: "/game/:world?", name: "game", component: GameView },
  {
    path: "/character/:world?/step/:step",
    name: "character-step",
    component: CharacterCreatorView,
  },
  {
    path: "/character/:world?",
    redirect: (to: any) => {
      const world = to.params.world || "dnd";
      return `/character/${world}/step/1`;
    },
  },
  { path: "/levelup/:world?", name: "levelup", component: CharacterLevelupView },
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to check authentication
router.beforeEach((to, _from, next) => {
  const isPublic = to.meta.public === true;
  const isAuthenticated = authService.isAuthenticated();

  if (!isPublic && !isAuthenticated) {
    // Redirect to login if not authenticated and trying to access protected route
    next({ name: 'login' });
  } else if (to.name === 'login' && isAuthenticated) {
    // Redirect to home if already authenticated and trying to access login
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
