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
function createInitialCombatState() {
  return {
    inCombat: ref(false),
    roundNumber: ref(1),
    enemies: ref<CombatEnemyDto[]>([]),
    turnOrder: ref<CombatantDto[]>([]),
    playerInitiative: ref(0),
    currentTarget: ref<string | null>(null),
    actionToken: ref<string | null>(null),
    phase: ref<CombatPhase>('PLAYER_TURN'),
    expectedDto: ref<string>('AttackRequestDto'),
  };
}

function createAttackModalState() {
  return {
    showAttackResultModal: ref(false),
    currentAttackResult: ref<AttackResultDto | null>(null),
    isCurrentAttackPlayerAttack: ref(true),
    attackResultQueue: ref<AttackQueueItem[]>([]),
    isAnimatingAttacks: ref(false),
  };
}

function updateEnemiesFromResult(enemies: Ref<CombatEnemyDto[]>, remainingEnemies: CombatEnemyDto[]): void {
  remainingEnemies.forEach((updatedEnemy) => {
    const existingEnemy = enemies.value.find(e => e.id === updatedEnemy.id);
    if (existingEnemy) {
      existingEnemy.hp = updatedEnemy.hp;
    }
  });
}

function selectNextAliveTarget(enemies: Ref<CombatEnemyDto[]>, currentTarget: Ref<string | null>): void {
  if (!currentTarget.value) return;
  const targetEnemy = enemies.value.find(e => e.name === currentTarget.value);
  if (!targetEnemy || targetEnemy.hp <= 0) {
    const firstAlive = enemies.value.find(e => e.hp > 0);
    currentTarget.value = firstAlive?.name ?? null;
  }
}

function createActions(
  combatState: ReturnType<typeof createInitialCombatState>,
  modalState: ReturnType<typeof createAttackModalState>,
  initializeCombat: (response: CombatStateDto) => void,
  clearCombat: () => void,
) {
  const setTarget = (targetName: string) => {
    const enemy = combatState.enemies.value.find(
      e => e.name.toLowerCase() === targetName.toLowerCase() && e.hp > 0,
    );
    if (enemy) combatState.currentTarget.value = enemy.name;
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
    combatState.actionToken.value = token;
    if (newPhase) combatState.phase.value = newPhase;
    if (newExpectedDto) combatState.expectedDto.value = newExpectedDto;
  };

  const queueAttackResults = (playerAttacks: AttackResultDto[], enemyAttacks: AttackResultDto[]) => {
    playerAttacks.forEach(result => modalState.attackResultQueue.value.push({
      result,
      isPlayerAttack: true,
    }));
    enemyAttacks.forEach(result => modalState.attackResultQueue.value.push({
      result,
      isPlayerAttack: false,
    }));
  };

  const showNextAttackResult = (): boolean => {
    if (modalState.attackResultQueue.value.length === 0) {
      modalState.isAnimatingAttacks.value = false;
      return false;
    }
    const next = modalState.attackResultQueue.value.shift();
    if (next) {
      modalState.currentAttackResult.value = next.result;
      modalState.isCurrentAttackPlayerAttack.value = next.isPlayerAttack;
      modalState.showAttackResultModal.value = true;
    }
    return true;
  };

  const closeAttackResultModal = () => {
    modalState.showAttackResultModal.value = false;
    setTimeout(() => showNextAttackResult(), 300);
  };

  const startAttackAnimation = (playerAttacks: AttackResultDto[], enemyAttacks: AttackResultDto[]) => {
    queueAttackResults(playerAttacks, enemyAttacks);
    modalState.isAnimatingAttacks.value = true;
    showNextAttackResult();
  };

  return {
    setTarget,
    startCombat,
    fetchStatus,
    setActionToken,
    queueAttackResults,
    showNextAttackResult,
    closeAttackResultModal,
    startAttackAnimation,
  };
}

export const useCombatStore = defineStore('combatStore', () => {
  const combatState = createInitialCombatState();
  const modalState = createAttackModalState();

  const aliveEnemies = computed(() => combatState.enemies.value.filter(e => (e.hp ?? 0) > 0));
  const validTargets = computed(() => aliveEnemies.value.map(e => e.name));
  const hasValidTarget = computed(() => validTargets.value.length > 0);

  const initializeCombat = (response: CombatStateDto): void => {
    console.log('[combatStore] initializeCombat', response);
    combatState.inCombat.value = response.inCombat;
    combatState.roundNumber.value = response.roundNumber;
    combatState.playerInitiative.value = response.player.initiative ?? 0;
    combatState.enemies.value = response.enemies ?? [];
    combatState.turnOrder.value = response.turnOrder ?? [];
    combatState.actionToken.value = response.actionToken ?? null;
    combatState.phase.value = response.phase ?? 'PLAYER_TURN';
    combatState.expectedDto.value = response.expectedDto ?? 'AttackRequestDto';
    if (response.enemies.length > 0) {
      combatState.currentTarget.value = response.enemies[0].name;
    }
  };

  const updateFromTurnResult = (result: TurnResultWithInstructionsDto) => {
    updateEnemiesFromResult(combatState.enemies, result.remainingEnemies);
    combatState.roundNumber.value = result.roundNumber;
    if (result.combatEnded) {
      combatState.inCombat.value = false;
      combatState.phase.value = 'COMBAT_ENDED';
      combatState.actionToken.value = null;
    }
    selectNextAliveTarget(combatState.enemies, combatState.currentTarget);
  };

  const clearCombat = () => Object.assign(combatState, createInitialCombatState());

  const actions = createActions(combatState, modalState, initializeCombat, clearCombat);

  return {
    ...combatState,
    ...modalState,
    aliveEnemies,
    validTargets,
    hasValidTarget,
    initializeCombat,
    updateFromTurnResult,
    clearCombat,
    ...actions,
  };
});
