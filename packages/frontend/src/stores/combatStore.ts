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

  const aliveEnemies = computed(() => enemies.value.filter(e => (e.hp ?? 0) > 0));
  const validTargets = computed(() => aliveEnemies.value.map(e => e.name));
  const hasValidTarget = computed(() => validTargets.value.length > 0);

  const initializeCombat = (response: CombatStateDto): void => {
    console.log('[combatStore] initializeCombat', response);
    inCombat.value = response.inCombat;
    roundNumber.value = response.roundNumber;
    playerInitiative.value = response.player.initiative ?? 0;
    enemies.value = response.enemies ?? [];
    turnOrder.value = response.turnOrder ?? [];
    actionToken.value = response.actionToken ?? null;
    phase.value = response.phase ?? 'PLAYER_TURN';
    expectedDto.value = response.expectedDto ?? 'AttackRequestDto';
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
    if (result.combatEnded) {
      inCombat.value = false;
      phase.value = 'COMBAT_ENDED';
      actionToken.value = null;
    }
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
    showAttackResultModal,
    currentAttackResult,
    isCurrentAttackPlayerAttack,
    attackResultQueue,
    isAnimatingAttacks,
    aliveEnemies,
    validTargets,
    hasValidTarget,
    initializeCombat,
    updateFromTurnResult,
    clearCombat,
    startCombat,
    fetchStatus,
    setActionToken,
    startAttackAnimation,
    closeAttackResultModal,
  };
});
