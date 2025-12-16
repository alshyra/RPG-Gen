import { createRouter, createWebHistory } from "vue-router";
import LandingView from "../views/LandingView.vue";
import HomeView from "../views/HomeView.vue";
import GameView from "../views/GameView.vue";
import MessagesView from "../views/game/MessagesView.vue";
import InventoryView from "../views/game/InventoryView.vue";
import SkillsView from "../views/game/SkillsView.vue";
import SpellsView from "../views/game/SpellsView.vue";
import QuestView from "../views/game/QuestView.vue";
import CharacterCreatorView from "../views/CharacterCreatorView.vue";
import CharacterLevelupView from "../views/CharacterLevelupView.vue";
import NotFoundView from "../views/NotFoundView.vue";
import LoginView from "../views/LoginView.vue";
import AuthCallbackView from "../views/AuthCallbackView.vue";
import { authApi } from "@rpg-gen/api-client";
import CombatPanel from "@/components/game/combat-panel/CombatPanel.vue";
import { useCombat } from "@rpg-gen/api-client";
import { useCharacterId } from "@/composables/useCharacterId";

const routes = [
  {
    path: "/",
    name: "landing",
    component: LandingView,
    meta: { public: true },
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { public: true },
  },
  {
    path: "/auth/callback",
    name: "auth-callback",
    component: AuthCallbackView,
    meta: { public: true },
  },
  {
    path: "/home",
    name: "home",
    component: HomeView,
  },
  {
    path: "/game/:characterId",
    component: GameView,
    children: [
      {
        path: "game",
        name: "game",
        redirect: { name: "game-message" },
      },
      {
        path: "messages",
        name: "game-message",
        component: MessagesView,
      },
      {
        path: "inventory",
        name: "game-inventory",
        component: InventoryView,
      },
      {
        path: "skills",
        name: "game-skills",
        component: SkillsView,
      },
      {
        path: "spells",
        name: "game-spells",
        component: SpellsView,
      },
      {
        path: "quest",
        name: "game-quest",
        component: QuestView,
      },
      {
        path: "combat",
        name: "game-combat",
        component: CombatPanel,
      },
    ],
  },
  {
    path: "/character/:characterId/step/:step",
    name: "character-step",
    component: CharacterCreatorView,
  },
  {
    path: "/levelup/:world?",
    name: "levelup",
    component: CharacterLevelupView,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to check authentication and combat status
router.beforeEach(async (to, _from, next) => {
  const isPublic = to.meta.public === true;

  // Try to get profile to check auth status
  let isAuthenticated = false;
  try {
    await authApi.getProfile();
    isAuthenticated = true;
  } catch {
    isAuthenticated = false;
  }

  if (!isPublic && !isAuthenticated) {
    // Redirect to login if not authenticated and trying to access protected route
    next({ name: "login" });
  } else if (to.name === "login" && isAuthenticated) {
    // Redirect to home if already authenticated and trying to access login
    next({ name: "home" });
  } else if (to.name === "game-combat") {
    // Protect combat route: redirect to game messages if not in combat
    const characterId = useCharacterId();
    const combat = useCombat(characterId);
    const inCombat = combat.status.data.value?.inCombat ?? false;
    if (!inCombat) {
      next({
        name: "game",
        params: { characterId: to.params.characterId },
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
