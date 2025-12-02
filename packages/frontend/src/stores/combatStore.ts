import { defineStore } from 'pinia';
import {
  computed, ref,
} from 'vue';
import { combatService } from '../apis/combatApi';
import type {
  CombatantDto, TurnResultWithInstructionsDto, CombatEnemyDto, CombatStartRequestDto, AttackResultDto, CombatStateDto,
} from '@rpg-gen/shared';
import type { CombatPhase } from '@rpg-gen/shared';
import type { Ref } from 'vue';

// Helper types
interface AttackQueueItem {
  result: AttackResultDto;
  isPlayerAttack: boolean;
}

// Pure helper functions

export const useCombatStore = defineStore('combatStore', () => {
  const inCombat = ref(false);
  const roundNumber = ref(1);
  const enemies = ref<CombatEnemyDto[]>([]);
  const turnOrder = ref<CombatantDto[]>([]);
  const playerInitiative = ref(0);
  const currentTarget = ref<CombatEnemyDto | null>(null);
  const actionToken = ref<string | null>(null);
  const phase = ref<CombatPhase>('PLAYER_TURN');
  const expectedDto = ref<string>('AttackRequestDto');
  const showAttackResultModal = ref(false);
  const currentAttackResult = ref<AttackResultDto | null>(null);
  const isCurrentAttackPlayerAttack = ref(true);
  const attackResultQueue = ref<AttackQueueItem[]>([]);
  const isAnimatingAttacks = ref(false);
  const currentTurnIndex = ref(0);

  // D&D 5e Action Economy
  const actionRemaining = ref(1);
  const actionMax = ref(1);
  const bonusActionRemaining = ref(1);
  const bonusActionMax = ref(1);

  const aliveEnemies = computed(() => enemies.value.filter(e => (e.hp ?? 0) > 0));
  const validTargets = computed(() => aliveEnemies.value.map(e => e.name));
  const hasValidTarget = computed(() => validTargets.value.length > 0);
  const canAct = computed(() => (actionRemaining.value ?? 0) > 0);
  const canBonusAct = computed(() => (bonusActionRemaining.value ?? 0) > 0);

  // Get current combatant from turn order
  const currentCombatant = computed(() => {
    if (turnOrder.value.length === 0) return null;
    return turnOrder.value[currentTurnIndex.value] ?? null;
  });

  const isPlayerTurn = computed(() => currentCombatant.value?.isPlayer ?? false);

  const initializeCombat = (response: CombatStateDto): void => {
    console.log('[combatStore] initializeCombat', response);
    inCombat.value = response.inCombat;
    roundNumber.value = response.roundNumber;
    playerInitiative.value = response.player.initiative ?? 0;
    enemies.value = response.enemies ?? [];
    turnOrder.value = response.turnOrder ?? [];
    currentTurnIndex.value = response.currentTurnIndex ?? 0;
    actionToken.value = response.actionToken ?? null;
    phase.value = response.phase ?? 'PLAYER_TURN';
    expectedDto.value = response.expectedDto ?? 'AttackRequestDto';

    // Action economy
    actionRemaining.value = response.actionRemaining ?? 1;
    actionMax.value = response.actionMax ?? 1;
    bonusActionRemaining.value = response.bonusActionRemaining ?? 1;
    bonusActionMax.value = response.bonusActionMax ?? 1;

    if (response.enemies.length > 0) {
      [currentTarget.value] = response.enemies;
    }
  };

  const selectNextAliveTarget = (enemies: Ref<CombatEnemyDto[]>): CombatEnemyDto | null => enemies.value.find(e => e.hp > 0) || null;

  const updateEnemiesFromResult = (enemies: Ref<CombatEnemyDto[]>, remainingEnemies: CombatEnemyDto[]) => enemies.value.map((enemy) => {
    const updatedEnemy = remainingEnemies.find(e => e.id === enemy.id);
    return updatedEnemy
      ? {
          ...enemy,
          hp: updatedEnemy.hp,
        }
      : enemy;
  });

  const updateFromTurnResult = (result: TurnResultWithInstructionsDto) => {
    enemies.value = updateEnemiesFromResult(enemies, result.remainingEnemies);
    roundNumber.value = result.roundNumber;

    // Update action economy from result
    if (result.actionRemaining !== undefined) actionRemaining.value = result.actionRemaining;
    if (result.actionMax !== undefined) actionMax.value = result.actionMax;
    if (result.bonusActionRemaining !== undefined) bonusActionRemaining.value = result.bonusActionRemaining;
    if (result.bonusActionMax !== undefined) bonusActionMax.value = result.bonusActionMax;
    if (result.phase) {
      phase.value = result.phase;
      // If phase returned to PLAYER_TURN, reset expectedDto to accept new attacks
      if (result.phase === 'PLAYER_TURN') {
        expectedDto.value = 'AttackRequestDto';
      }
    }

    if (result.combatEnded) {
      inCombat.value = false;
      phase.value = 'COMBAT_ENDED';
      actionToken.value = null;
    }
    currentTarget.value = selectNextAliveTarget(enemies);
  };

  /**
   * Update only enemies and round number without touching phase/expectedDto.
   * Used when attack hits and a roll instruction is pending.
   */
  const updateEnemiesOnly = (remainingEnemies: CombatEnemyDto[], newRoundNumber: number) => {
    enemies.value = updateEnemiesFromResult(enemies, remainingEnemies);
    roundNumber.value = newRoundNumber;
    currentTarget.value = selectNextAliveTarget(enemies);
  };

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
    showAttackResultModal.value = false;
    currentAttackResult.value = null;
    isCurrentAttackPlayerAttack.value = true;
    attackResultQueue.value = [];
    isAnimatingAttacks.value = false;
    currentTurnIndex.value = 0;
    actionRemaining.value = 1;
    actionMax.value = 1;
    bonusActionRemaining.value = 1;
    bonusActionMax.value = 1;
  };

  const startCombat = async (characterId: string, instruction: CombatStartRequestDto) => {
    console.log('[combatStore] startCombat request', {
      characterId,
      instruction,
    });
    const response = await combatService.startCombat(characterId, instruction);
    console.log('[combatStore] startCombat response', response);
    initializeCombat(response);
    return response;
  };

  const fetchStatus = async (characterId: string) => {
    console.log('[combatStore] fetchStatus for', characterId);
    const response = await combatService.getStatus(characterId);
    console.log('[combatStore] fetchStatus response', response);
    if (response.inCombat && response.enemies) initializeCombat(response);
    else clearCombat();
    return response;
  };

  const setActionToken = (token: string | null, newPhase?: CombatPhase, newExpectedDto?: string) => {
    actionToken.value = token;
    if (newPhase) phase.value = newPhase;
    if (newExpectedDto) expectedDto.value = newExpectedDto;
  };

  const setCurrentTarget = (target: CombatEnemyDto | null) => {
    currentTarget.value = target;
  };

  const queueAttackResults = (playerAttacks: AttackResultDto[], enemyAttacks: AttackResultDto[]) => {
    playerAttacks.forEach(result => attackResultQueue.value.push({
      result,
      isPlayerAttack: true,
    }));
    enemyAttacks.forEach(result => attackResultQueue.value.push({
      result,
      isPlayerAttack: false,
    }));
  };

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

  const closeAttackResultModal = () => {
    showAttackResultModal.value = false;
    setTimeout(() => showNextAttackResult(), 300);
  };

  const startAttackAnimation = (playerAttacks: AttackResultDto[], enemyAttacks: AttackResultDto[]) => {
    queueAttackResults(playerAttacks, enemyAttacks);
    isAnimatingAttacks.value = true;
    showNextAttackResult();
  };

  /**
   * End the current player activation and advance turn.
   * This triggers enemy actions until the next player activation.
   */
  const endActivation = async (characterId: string) => {
    console.log('[combatStore] endActivation for', characterId);
    const response = await combatService.endActivation(characterId);
    console.log('[combatStore] endActivation response', response);

    // Update state from response
    updateFromTurnResult(response);

    // Show enemy attack animations if any
    if (response.enemyAttacks && response.enemyAttacks.length > 0) {
      startAttackAnimation([], response.enemyAttacks);
    }

    // Refresh full status to get new action token
    await fetchStatus(characterId);

    return response;
  };

  return {
    inCombat,
    enemies,
    currentTarget,
    roundNumber,
    actionToken,
    phase,
    expectedDto,
    playerInitiative,
    turnOrder,
    currentTurnIndex,
    showAttackResultModal,
    currentAttackResult,
    isCurrentAttackPlayerAttack,
    attackResultQueue,
    isAnimatingAttacks,
    // Action economy
    actionRemaining,
    actionMax,
    bonusActionRemaining,
    bonusActionMax,
    // Computed
    aliveEnemies,
    validTargets,
    hasValidTarget,
    canAct,
    canBonusAct,
    currentCombatant,
    isPlayerTurn,
    // Actions
    initializeCombat,
    updateFromTurnResult,
    updateEnemiesOnly,
    clearCombat,
    setCurrentTarget,
    startCombat,
    fetchStatus,
    setActionToken,
    startAttackAnimation,
    closeAttackResultModal,
    endActivation,
  };
});
