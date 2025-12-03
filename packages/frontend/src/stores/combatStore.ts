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
  const currentAttackResult = ref<TurnResultWithInstructionsDto>();
  const isCurrentAttackPlayerAttack = ref(true);
  const attackResultQueue = ref<AttackQueueItem[]>([]);
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
    // prefer the included state snapshot to avoid relying on duplicated turn fields
    const s = result.state;
    if (s) {
      enemies.value = s.enemies ?? updateEnemiesFromResult(enemies, result.remainingEnemies);
      roundNumber.value = s.roundNumber ?? result.roundNumber;
      turnOrder.value = s.turnOrder ?? turnOrder.value;
      currentTurnIndex.value = s.currentTurnIndex ?? currentTurnIndex.value;
      playerInitiative.value = s.player?.initiative ?? playerInitiative.value;
      expectedDto.value = s.expectedDto ?? expectedDto.value;
      actionRemaining.value = s.actionRemaining ?? actionRemaining.value;
      actionMax.value = s.actionMax ?? actionMax.value;
      bonusActionRemaining.value = s.bonusActionRemaining ?? bonusActionRemaining.value;
      bonusActionMax.value = s.bonusActionMax ?? bonusActionMax.value;
      phase.value = s.phase ?? phase.value;
    } else {
      enemies.value = updateEnemiesFromResult(enemies, result.remainingEnemies);
      roundNumber.value = result.roundNumber;
    }

    // Update action economy from result
    // action economy may be returned directly, but prefer values from result.state when available
    if (result.state) {
      if (result.state.actionRemaining !== undefined) actionRemaining.value = result.state.actionRemaining;
      if (result.state.actionMax !== undefined) actionMax.value = result.state.actionMax;
      if (result.state.bonusActionRemaining !== undefined) bonusActionRemaining.value = result.state.bonusActionRemaining;
      if (result.state.bonusActionMax !== undefined) bonusActionMax.value = result.state.bonusActionMax;
      if (result.state.phase) {
        phase.value = result.state.phase;
        // If phase returned to PLAYER_TURN, reset expectedDto to accept new attacks
        if (result.state.phase === 'PLAYER_TURN') {
          expectedDto.value = 'AttackRequestDto';
        }
      }
    } else if ((result as any).phase) {
      // legacy fallback: some older servers returned phase at top-level
      const p = (result as any).phase as unknown as typeof phase.value;
      phase.value = p;
      // If phase returned to PLAYER_TURN, reset expectedDto to accept new attacks
      if (p === 'PLAYER_TURN') {
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

  // eslint-disable-next-line max-statements
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
    currentAttackResult.value = undefined;
    isCurrentAttackPlayerAttack.value = true;
    attackResultQueue.value = [];
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
    startCombat,
    fetchStatus,
    setActionToken,
    endActivation,
  };
});
