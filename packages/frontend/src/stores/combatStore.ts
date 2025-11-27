import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { combatService } from '../apis/combatApi';

export interface CombatStoreEnemy {
  id: string;
  name: string;
  hp: number;
  hpMax: number;
  initiative: number;
}

// eslint-disable-next-line max-statements
export const useCombatStore = defineStore('combatStore', () => {
  // Combat state
  const inCombat = ref(false);
  const roundNumber = ref(1);
  const enemies = ref<CombatStoreEnemy[]>([]);
  const turnOrder = ref<Combatant[]>([]);
  const playerHp = ref(0);
  const playerHpMax = ref(0);
  const playerInitiative = ref(0);
  const currentTarget = ref<string | null>(null);

  // Computed properties
  const aliveEnemies = computed(() => enemies.value.filter(e => e.hp > 0));
  const validTargets = computed(() => aliveEnemies.value.map(e => e.name));
  const hasValidTarget = computed(() => validTargets.value.length > 0);

  /**
   * Initialize combat state from backend response
   */
  const initializeCombat = (response: {
    inCombat: boolean;
    roundNumber: number;
    playerInitiative: number;
    playerHp: number;
    playerHpMax: number;
    enemies: CombatStoreEnemy[];
    turnOrder: Combatant[];
  }) => {
    inCombat.value = response.inCombat;
    roundNumber.value = response.roundNumber;
    playerInitiative.value = response.playerInitiative;
    playerHp.value = response.playerHp;
    playerHpMax.value = response.playerHpMax;
    enemies.value = response.enemies;
    turnOrder.value = response.turnOrder;

    // Auto-select first enemy as target
    if (response.enemies.length > 0) {
      currentTarget.value = response.enemies[0].name;
    }
  };

  /**
   * Update combat state after an attack
   */
  const updateFromTurnResult = (result: TurnResult) => {
    // Update player HP
    playerHp.value = result.playerHp;

    // Update enemy HP from remaining enemies
    result.remainingEnemies.forEach((updatedEnemy: CombatEnemy) => {
      const existingEnemy = enemies.value.find(e => e.id === updatedEnemy.id);
      if (existingEnemy) {
        existingEnemy.hp = updatedEnemy.hp;
      }
    });

    // Update round number
    roundNumber.value = result.roundNumber;

    // Check if combat ended
    if (result.combatEnded) {
      inCombat.value = false;
    }

    // Update target if current target is dead
    if (currentTarget.value) {
      const targetEnemy = enemies.value.find(e => e.name === currentTarget.value);
      if (!targetEnemy || targetEnemy.hp <= 0) {
        const firstAlive = enemies.value.find(e => e.hp > 0);
        currentTarget.value = firstAlive?.name ?? null;
      }
    }
  };

  /**
   * Set current target enemy
   */
  const setTarget = (targetName: string) => {
    const enemy = enemies.value.find(e => e.name.toLowerCase() === targetName.toLowerCase() && e.hp > 0);
    if (enemy) {
      currentTarget.value = enemy.name;
    }
  };

  /**
   * Clear combat state
   */
  const clearCombat = () => {
    inCombat.value = false;
    roundNumber.value = 1;
    enemies.value = [];
    turnOrder.value = [];
    playerHp.value = 0;
    playerHpMax.value = 0;
    playerInitiative.value = 0;
    currentTarget.value = null;
  };

  /**
   * Start combat from a combat_start instruction
   */
  const startCombat = async (characterId: string, instruction: CombatStartInstruction) => {
    const response = await combatService.startCombat(characterId, instruction);
    initializeCombat(response);
    return response;
  };

  /**
   * Fetch current combat status from backend
   */
  const fetchStatus = async (characterId: string) => {
    const response = await combatService.getStatus(characterId);
    if (response.inCombat && response.enemies) {
      initializeCombat({
        inCombat: true,
        roundNumber: response.roundNumber ?? 1,
        playerInitiative: 0,
        playerHp: response.playerHp ?? 0,
        playerHpMax: response.playerHpMax ?? 0,
        enemies: response.enemies.map((e: { id: string; name: string; hp: number; hpMax: number }) => ({
          ...e,
          initiative: 0,
        })),
        turnOrder: [],
      });
    } else {
      clearCombat();
    }
    return response;
  };

  return {
    // State
    inCombat,
    roundNumber,
    enemies,
    turnOrder,
    playerHp,
    playerHpMax,
    playerInitiative,
    currentTarget,

    // Computed
    aliveEnemies,
    validTargets,
    hasValidTarget,

    // Actions
    initializeCombat,
    updateFromTurnResult,
    setTarget,
    clearCombat,
    startCombat,
    fetchStatus,
  };
});
