import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { combatService } from '../apis/combatApi';
import type {
  CombatantDto, CombatStartRequestDto, CombatStateDto,
  AttackResponseDto, EndPlayerTurnResponseDto, EnemyAttackLogDto,
} from '@rpg-gen/shared';
import type { CombatPhase } from '@rpg-gen/shared';
import type { Ref } from 'vue';

interface AttackQueueItem {
  result: AttackResponseDto;
  isPlayerAttack: boolean;
}

const ANIMATION_DELAY_MS = 800;

export const useCombatStore = defineStore('combatStore', () => {
  const inCombat = ref(false);
  const roundNumber = ref(1);
  const enemies = ref<CombatantDto[]>([]);
  const player = ref<CombatantDto | null>(null);
  const turnOrder = ref<CombatantDto[]>([]);
  const playerInitiative = ref(0);
  const currentTarget = ref<CombatantDto | null>(null);
  const actionToken = ref<string | null>(null);
  const phase = ref<CombatPhase>('PLAYER_TURN');
  const expectedDto = ref<string>('AttackRequestDto');
  const showAttackResultModal = ref(false);
  const currentAttackResult = ref<AttackResponseDto>();
  const isCurrentAttackPlayerAttack = ref(true);
  const attackResultQueue = ref<AttackQueueItem[]>([]);
  const currentTurnIndex = ref(0);
  const isProcessingEnemyTurn = ref(false);
  const currentEnemyAttackLog = ref<EnemyAttackLogDto | null>(null);

  const actionRemaining = ref(1);
  const actionMax = ref(1);
  const bonusActionRemaining = ref(1);
  const bonusActionMax = ref(1);

  const aliveEnemies = computed(() => enemies.value.filter(e => (e.hp ?? 0) > 0));
  const validTargets = computed(() => aliveEnemies.value.map(e => e.name));
  const hasValidTarget = computed(() => validTargets.value.length > 0);
  const canAct = computed(() => (actionRemaining.value ?? 0) > 0);
  const canBonusAct = computed(() => (bonusActionRemaining.value ?? 0) > 0);

  const currentCombatant = computed(() => {
    if (turnOrder.value.length === 0) return null;
    return turnOrder.value[currentTurnIndex.value] ?? null;
  });

  const isPlayerTurn = computed(() => currentCombatant.value?.isPlayer ?? false);
  const canPlayerAct = computed(() => !isProcessingEnemyTurn.value && canAct.value);

  const setCombatParticipants = (response: CombatStateDto): void => {
    player.value = response.player ?? null;
    playerInitiative.value = response.player?.initiative ?? 0;
    enemies.value = response.enemies ?? [];
    turnOrder.value = response.turnOrder ?? [];
    if (response.enemies.length > 0) {
      [currentTarget.value] = response.enemies;
    }
  };

  const setCombatState = (response: CombatStateDto): void => {
    inCombat.value = response.inCombat;
    roundNumber.value = response.roundNumber;
    currentTurnIndex.value = response.currentTurnIndex ?? 0;
    actionToken.value = response.actionToken ?? null;
    phase.value = response.phase ?? 'PLAYER_TURN';
    expectedDto.value = response.expectedDto ?? 'AttackRequestDto';
  };

  const setActionEconomy = (response: CombatStateDto): void => {
    actionRemaining.value = response.actionRemaining ?? 1;
    actionMax.value = response.actionMax ?? 1;
    bonusActionRemaining.value = response.bonusActionRemaining ?? 1;
    bonusActionMax.value = response.bonusActionMax ?? 1;
  };

  const initializeCombat = (response: CombatStateDto): void => {
    setCombatParticipants(response);
    setCombatState(response);
    setActionEconomy(response);
  };

  const selectNextAliveTarget = (enemyList: Ref<CombatantDto[]>): CombatantDto | null => enemyList.value.find(e => (e.hp ?? 0) > 0) ?? null;

  const applyDamageToPlayer = (damage: number): void => {
    if (!player.value) return;
    const newHp = Math.max(0, (player.value.hp ?? 0) - damage);
    player.value = {
      ...player.value,
      hp: newHp,
    };
  };

  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  const processOneAttackLog = async (log: EnemyAttackLogDto): Promise<void> => {
    currentEnemyAttackLog.value = log;
    if (log.hit && log.damageTotal) {
      applyDamageToPlayer(log.damageTotal);
    }
    await delay(ANIMATION_DELAY_MS);
  };

  const processAttackLogs = async (logs: EnemyAttackLogDto[]): Promise<void> => {
    isProcessingEnemyTurn.value = true;
    await logs.reduce(
      async (prev, log) => {
        await prev;
        await processOneAttackLog(log);
      },
      Promise.resolve(),
    );
    currentEnemyAttackLog.value = null;
    isProcessingEnemyTurn.value = false;
  };

  const applyTurnCombatState = (combatState: CombatStateDto): void => {
    enemies.value = combatState.enemies ?? enemies.value;
    roundNumber.value = combatState.roundNumber ?? roundNumber.value;
    turnOrder.value = combatState.turnOrder ?? turnOrder.value;
    currentTurnIndex.value = combatState.currentTurnIndex ?? currentTurnIndex.value;
    expectedDto.value = combatState.expectedDto ?? expectedDto.value;
    actionToken.value = combatState.actionToken ?? actionToken.value;
    phase.value = combatState.phase ?? phase.value;
    if (combatState.phase === 'PLAYER_TURN') expectedDto.value = 'AttackRequestDto';
  };

  const applyTurnActionEconomy = (s: CombatStateDto): void => {
    actionRemaining.value = s.actionRemaining ?? actionRemaining.value;
    actionMax.value = s.actionMax ?? actionMax.value;
    bonusActionRemaining.value = s.bonusActionRemaining ?? bonusActionRemaining.value;
    bonusActionMax.value = s.bonusActionMax ?? bonusActionMax.value;
  };

  const checkCombatEnd = (result: EndPlayerTurnResponseDto): void => {
    if (result.playerDefeated || (result.combatState?.enemies?.length === 0)) {
      inCombat.value = false;
      phase.value = 'COMBAT_ENDED';
      actionToken.value = null;
    }
  };

  const updateFromTurnResult = (result: EndPlayerTurnResponseDto): void => {
    if (result.combatState) {
      applyTurnCombatState(result.combatState);
      applyTurnActionEconomy(result.combatState);
    } else {
      roundNumber.value = result.roundNumber;
    }
    checkCombatEnd(result);
    currentTarget.value = selectNextAliveTarget(enemies);
  };

  const updateEnemiesOnly = (remainingEnemies: CombatantDto[], newRoundNumber: number): void => {
    enemies.value = enemies.value.map((enemy) => {
      const updated = remainingEnemies.find(e => e.id === enemy.id);
      return updated
        ? {
            ...enemy,
            hp: updated.hp,
          }
        : enemy;
    });
    roundNumber.value = newRoundNumber;
    currentTarget.value = selectNextAliveTarget(enemies);
  };

  const resetCombatParticipants = (): void => {
    enemies.value = [];
    turnOrder.value = [];
    playerInitiative.value = 0;
    currentTarget.value = null;
  };

  const resetCombatState = (): void => {
    inCombat.value = false;
    roundNumber.value = 1;
    actionToken.value = null;
    phase.value = 'PLAYER_TURN';
    expectedDto.value = 'AttackRequestDto';
    currentTurnIndex.value = 0;
  };

  const resetActionEconomy = (): void => {
    actionRemaining.value = 1;
    actionMax.value = 1;
    bonusActionRemaining.value = 1;
    bonusActionMax.value = 1;
  };

  const resetModalState = (): void => {
    showAttackResultModal.value = false;
    currentAttackResult.value = undefined;
    isCurrentAttackPlayerAttack.value = true;
    attackResultQueue.value = [];
    isProcessingEnemyTurn.value = false;
    currentEnemyAttackLog.value = null;
  };

  const clearCombat = (): void => {
    resetCombatParticipants();
    resetCombatState();
    resetActionEconomy();
    resetModalState();
  };

  const startCombat = async (characterId: string, instruction: CombatStartRequestDto) => {
    const response = await combatService.startCombat(characterId, instruction);
    initializeCombat(response);
    return response;
  };

  const fetchStatus = async (characterId: string) => {
    const response = await combatService.getStatus(characterId);
    if (response.inCombat && response.enemies) initializeCombat(response);
    else clearCombat();
    return response;
  };

  const setActionToken = (token: string | null, newPhase?: CombatPhase, newExpectedDto?: string): void => {
    actionToken.value = token;
    if (newPhase) phase.value = newPhase;
    if (newExpectedDto) expectedDto.value = newExpectedDto;
  };

  const endActivation = async (characterId: string) => {
    const response = await combatService.endActivation(characterId);
    if (response.attackLogs?.length) {
      await processAttackLogs(response.attackLogs);
    }
    updateFromTurnResult(response);
    return response;
  };

  return {
    inCombat,
    enemies,
    player,
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
    actionRemaining,
    actionMax,
    bonusActionRemaining,
    bonusActionMax,
    aliveEnemies,
    validTargets,
    hasValidTarget,
    canAct,
    canBonusAct,
    canPlayerAct,
    currentCombatant,
    isPlayerTurn,
    isProcessingEnemyTurn,
    currentEnemyAttackLog,
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
