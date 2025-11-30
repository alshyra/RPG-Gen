import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { combatService, type ExtendedCombatStateDto } from '../apis/combatApi';
import type { CombatantDto, TurnResultWithInstructionsDto, CombatEnemyDto, CombatStartRequestDto, AttackResultDto } from '@rpg-gen/shared';

export type CombatPhase = 'PLAYER_TURN' | 'AWAITING_DAMAGE_ROLL' | 'ENEMY_TURN' | 'COMBAT_ENDED';

// eslint-disable-next-line max-statements
export const useCombatStore = defineStore('combatStore', () => {
  // Combat state
  const inCombat = ref(false);
  const roundNumber = ref(1);
  const enemies = ref<CombatEnemyDto[]>([]);
  const turnOrder = ref<CombatantDto[]>([]);
  const playerInitiative = ref(0);
  const currentTarget = ref<string | null>(null);

  // Action token state for idempotent operations
  const actionToken = ref<string | null>(null);
  const phase = ref<CombatPhase>('PLAYER_TURN');
  const expectedDto = ref<string>('AttackRequestDto');

  // Attack result modal state
  const showAttackResultModal = ref(false);
  const currentAttackResult = ref<AttackResultDto | null>(null);
  const isCurrentAttackPlayerAttack = ref(true);

  // Queue for displaying attack results one by one (for enemy animations)
  const attackResultQueue = ref<Array<{ result: AttackResultDto; isPlayerAttack: boolean }>>([]);
  const isAnimatingAttacks = ref(false);

  // Computed properties
  const aliveEnemies = computed(() => enemies.value.filter(e => (e.hp ?? 0) > 0));
  const validTargets = computed(() => aliveEnemies.value.map(e => e.name));
  const hasValidTarget = computed(() => validTargets.value.length > 0);

  /**
   * Initialize combat state from backend response
   */
  const initializeCombat = (response: ExtendedCombatStateDto) => {
    // prefer console.log instead of console.debug to avoid being hidden by console filters
    console.log('[combatStore] initializeCombat', response);
    inCombat.value = response.inCombat;
    roundNumber.value = response.roundNumber;
    playerInitiative.value = response.player.initiative ?? 0;
    enemies.value = response.enemies ?? [];
    turnOrder.value = response.turnOrder ?? [];

    // Store action token and phase if provided
    actionToken.value = response.actionToken ?? null;
    phase.value = (response.phase ?? 'PLAYER_TURN') as CombatPhase;
    expectedDto.value = response.expectedDto ?? 'AttackRequestDto';

    // Auto-select first enemy as target
    if (response.enemies.length > 0) {
      currentTarget.value = response.enemies[0].name;
    }
  };

  /**
   * Update combat state after an attack
   */
  const updateFromTurnResult = (result: TurnResultWithInstructionsDto) => {
    // Update enemy HP from remaining enemies
    result.remainingEnemies.forEach((updatedEnemy) => {
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
      phase.value = 'COMBAT_ENDED';
      actionToken.value = null;
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
    playerInitiative.value = 0;
    currentTarget.value = null;
    actionToken.value = null;
    phase.value = 'PLAYER_TURN';
    expectedDto.value = 'AttackRequestDto';
  };

  /**
   * Start combat from a combat_start instruction
   */
  const startCombat = async (characterId: string, instruction: CombatStartRequestDto) => {
    console.log('[combatStore] startCombat request', { characterId, instruction });
    const response = await combatService.startCombat(characterId, instruction);
    console.log('[combatStore] startCombat response', response);
    initializeCombat(response);
    return response;
  };

  /**
   * Fetch current combat status from backend (includes new actionToken)
   */
  const fetchStatus = async (characterId: string) => {
    console.log('[combatStore] fetchStatus for', characterId);
    const response = await combatService.getStatus(characterId);
    console.log('[combatStore] fetchStatus response', response);
    if (response.inCombat && response.enemies) {
      initializeCombat(response);
    } else {
      clearCombat();
    }
    return response;
  };

  /**
   * Update action token after receiving a new one from the server
   */
  const setActionToken = (token: string | null, newPhase?: CombatPhase, newExpectedDto?: string) => {
    actionToken.value = token;
    if (newPhase) phase.value = newPhase;
    if (newExpectedDto) expectedDto.value = newExpectedDto;
  };

  /**
   * Queue attack results from a turn for sequential display
   */
  const queueAttackResults = (playerAttacks: AttackResultDto[], enemyAttacks: AttackResultDto[]) => {
    // Add player attacks first
    playerAttacks.forEach((result) => {
      attackResultQueue.value.push({ result, isPlayerAttack: true });
    });
    // Then enemy attacks
    enemyAttacks.forEach((result) => {
      attackResultQueue.value.push({ result, isPlayerAttack: false });
    });
  };

  /**
   * Show the next attack result from the queue
   */
  const showNextAttackResult = (): boolean => {
    if (attackResultQueue.value.length === 0) {
      isAnimatingAttacks.value = false;
      return false;
    }

    const next = attackResultQueue.value.shift();
    if (next) {
      currentAttackResult.value = next.result;
      isCurrentAttackPlayerAttack.value = next.isPlayerAttack;
      showAttackResultModal.value = true;
    }
    return true;
  };

  /**
   * Close the current attack result modal and show the next one
   */
  const closeAttackResultModal = () => {
    showAttackResultModal.value = false;
    // Show next result after a short delay for visual clarity
    setTimeout(() => {
      showNextAttackResult();
    }, 300);
  };

  /**
   * Start the attack animation sequence
   */
  const startAttackAnimation = (playerAttacks: AttackResultDto[], enemyAttacks: AttackResultDto[]) => {
    queueAttackResults(playerAttacks, enemyAttacks);
    isAnimatingAttacks.value = true;
    showNextAttackResult();
  };

  return {
    // State
    inCombat,
    roundNumber,
    enemies,
    turnOrder,
    playerInitiative,
    currentTarget,
    actionToken,
    phase,
    expectedDto,

    // Attack result modal state
    showAttackResultModal,
    currentAttackResult,
    isCurrentAttackPlayerAttack,
    attackResultQueue,
    isAnimatingAttacks,

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
    setActionToken,
    queueAttackResults,
    showNextAttackResult,
    closeAttackResultModal,
    startAttackAnimation,
  };
});
