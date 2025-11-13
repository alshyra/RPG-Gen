import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import GameView from "../views/GameView.vue";
import CharacterCreatorView from "../views/CharacterCreatorView.vue";
import CharacterLevelupView from "../views/CharacterLevelupView.vue";

const routes = [
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
