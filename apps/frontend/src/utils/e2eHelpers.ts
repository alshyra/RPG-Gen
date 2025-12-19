/**
 * E2E Test Helpers
 *
 * Exposes internal methods on window for E2E test automation.
 * Only active in development/test mode.
 */

import type { CombatantDto } from "@rpg-gen/shared";

export interface E2ECombatApi {
  /**
   * Execute an attack on an enemy
   */
  attack: (targetId: string, spellName?: string) => Promise<void>;
  /**
   * End the player's turn
   */
  endTurn: () => Promise<void>;
  /**
   * Get current combat status
   */
  getStatus: () => {
    inCombat: boolean;
    enemies: Array<{ id: string; name: string; hp: number }>;
    player: { id: string; name: string; hp: number } | null;
    combatEnd: unknown;
  } | null;
  /**
   * Refresh combat state from backend
   */
  refetch: () => Promise<void>;
  /**
   * Initialize visual units on the PIXI canvas (call after refetch when combat starts)
   */
  initializeVisual: () => Promise<void>;
}

declare global {
  interface Window {
    __e2eCombat?: E2ECombatApi;
    __vueQueryClient?: unknown;
  }
}

/**
 * Expose combat methods on window for E2E tests
 * Call this from CombatPanel when mounted
 */
export function exposeE2ECombatApi(api: {
  executeAttack: (target: CombatantDto, spellName?: string) => Promise<void>;
  endTurn: () => Promise<void>;
  getEnemies: () => CombatantDto[];
  getPlayer: () => CombatantDto | null;
  isInCombat: () => boolean;
  getCombatEnd: () => unknown;
  refetch: () => Promise<void>;
  initializeVisual: () => Promise<void>;
}) {
  if (import.meta.env.DEV || import.meta.env.MODE === "test") {
    window.__e2eCombat = {
      attack: async (targetId: string, spellName?: string) => {
        const enemies = api.getEnemies();
        const target = enemies.find(e => e.id === targetId);
        if (!target) {
          throw new Error(
            `Enemy with id ${targetId} not found. Available: ${enemies.map(e => e.id).join(", ")}`,
          );
        }
        await api.executeAttack(target, spellName);
      },
      endTurn: api.endTurn,
      getStatus: () => {
        const enemies = api.getEnemies();
        const player = api.getPlayer();
        return {
          inCombat: api.isInCombat(),
          enemies: enemies.map(e => ({ id: e.id, name: e.name, hp: e.hp ?? 0 })),
          player: player ? { id: player.id, name: player.name, hp: player.hp ?? 0 } : null,
          combatEnd: api.getCombatEnd(),
        };
      },
      refetch: api.refetch,
      initializeVisual: api.initializeVisual,
    };
    console.log("[E2E] Combat API exposed on window.__e2eCombat");
  }
}

/**
 * Cleanup E2E combat API from window
 * Call this from CombatPanel when unmounted
 */
export function cleanupE2ECombatApi() {
  if (window.__e2eCombat) {
    delete window.__e2eCombat;
    console.log("[E2E] Combat API cleaned up");
  }
}
