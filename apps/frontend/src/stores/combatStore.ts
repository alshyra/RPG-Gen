import type { AttackQueueItem, AttackView } from "@/interfaces";
import type {
  CombatActionResponseDto,
  CombatantDto,
  CombatPhase,
  CombatStartRequestDto,
  EnemyAttackLogDto,
} from "@rpg-gen/shared";
import { useCombat } from "@rpg-gen/api-client";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

const ENEMY_ATTACK_DELAY_MS = 800;
const PLAYER_ATTACK_DELAY_MS = 1500;

/**
 * Combat Store - Mix of UI state and cached combat data from TanStack Query
 *
 * UI state: modals, animations, processing flags
 * API data: combat status managed by vue-query
 */
export const useCombatStore = defineStore("combatStore", () => {
  const route = useRoute();
  const currentCharacterId = computed(() =>
    typeof route.params.characterId === "string" ? route.params.characterId : undefined,
  );

  // --- Query Hooks ---
  const combat = useCombat(currentCharacterId);
  const combatStatus = combat.status.data;
  const isLoadingCombat = combat.isLoading;
  const refetchCombatStatus = combat.status.refetch;

  // --- UI State (modals, animations, processing) ---
  const showAttackResultModal = ref(false);
  const currentAttackResult = ref<CombatActionResponseDto>();
  const isCurrentAttackPlayerAttack = ref(true);
  const attackResultQueue = ref<AttackQueueItem[]>([]);
  const isProcessingEnemyTurn = ref(false);
  const currentEnemyAttackLog = ref<EnemyAttackLogDto | null>(null);
  const currentPlayerAttackLog = ref<CombatActionResponseDto | null>(null);
  const isEndingTurn = ref(false);
  const isCombatEndModalOpen = ref(false);
  const combatEndNarrative = ref<string>("");
  const currentAttackView = ref<AttackView | null>(null);

  // --- Local UI state for target selection ---
  const currentTarget = ref<CombatantDto | null>(null);

  // --- Computed properties from combat status ---
  const inCombat = computed(() => combatStatus.value?.inCombat ?? false);
  const roundNumber = computed(() => combatStatus.value?.roundNumber ?? 1);
  const enemies = computed(() => combatStatus.value?.enemies ?? []);
  const player = computed(() => combatStatus.value?.player ?? null);
  const turnOrder = computed(() => combatStatus.value?.turnOrder ?? []);
  const playerInitiative = computed(() => combatStatus.value?.player?.initiative ?? 0);
  const currentTurnIndex = computed(() => combatStatus.value?.currentTurnIndex ?? 0);
  const phase = computed<CombatPhase>(() => combatStatus.value?.phase ?? "PLAYER_TURN");

  const actionRemaining = computed(() => combatStatus.value?.actionRemaining ?? 1);
  const actionMax = computed(() => combatStatus.value?.actionMax ?? 1);
  const bonusActionRemaining = computed(() => combatStatus.value?.bonusActionRemaining ?? 1);
  const bonusActionMax = computed(() => combatStatus.value?.bonusActionMax ?? 1);

  const aliveEnemies = computed(() => enemies.value.filter(e => (e.hp ?? 0) > 0));
  const validTargets = computed(() => aliveEnemies.value.map(e => e.name));
  const hasValidTarget = computed(() => validTargets.value.length > 0);
  const canAct = computed(() => (actionRemaining.value ?? 0) > 0);
  const canBonusAct = computed(() => (bonusActionRemaining.value ?? 0) > 0);

  const currentCombatant = computed(() => {
    if (turnOrder.value.length === 0) return null;
    return turnOrder.value[currentTurnIndex.value] ?? null;
  });

  const isPlayerTurn = computed(() => {
    const cc = currentCombatant.value;
    if (!cc) return false;
    if (typeof cc.isPlayer === "boolean") return cc.isPlayer;
    if (player.value && cc.name && player.value.name) return cc.name === player.value.name;
    return false;
  });

  const canPlayerAct = computed(() => !isProcessingEnemyTurn.value && canAct.value);

  // --- Helpers ---
  const selectNextAliveTarget = (enemyList: CombatantDto[]): CombatantDto | null =>
    enemyList.find(e => (e.hp ?? 0) > 0) ?? null;

  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  const processOneAttackLog = async (log: EnemyAttackLogDto): Promise<void> => {
    currentEnemyAttackLog.value = log;
    await delay(ENEMY_ATTACK_DELAY_MS);
  };

  const processAttackLogs = async (logs: EnemyAttackLogDto[]): Promise<void> => {
    isProcessingEnemyTurn.value = true;
    await logs.reduce(async (prev, log) => {
      await prev;
      await processOneAttackLog(log);
    }, Promise.resolve());
    currentEnemyAttackLog.value = null;
    isProcessingEnemyTurn.value = false;
  };

  const resetModalState = (): void => {
    showAttackResultModal.value = false;
    currentAttackResult.value = undefined;
    currentAttackView.value = null;
    isCurrentAttackPlayerAttack.value = true;
    attackResultQueue.value = [];
    isProcessingEnemyTurn.value = false;
    currentEnemyAttackLog.value = null;
  };

  const clearCombat = (): void => {
    currentTarget.value = null;
    resetModalState();
  };

  // --- Actions ---
  const startCombat = async (characterId: string, instruction: CombatStartRequestDto) => {
    const response = await combat.startCombat.mutateAsync({ characterId, data: instruction });
    if (response.enemies && response.enemies.length > 0) {
      currentTarget.value = response.enemies[0];
    }
    return response;
  };

  const fetchStatus = async () => {
    await refetchCombatStatus();
  };

  const endActivation = async (characterId: string) => {
    const response = await combat.endTurn.mutateAsync(characterId);
    if (response.attackLogs?.length) {
      await processAttackLogs(response.attackLogs);
    }
    // Auto-select next target if current is dead
    currentTarget.value = selectNextAliveTarget(enemies.value);
    return response;
  };

  const performAttack = async (characterId: string, targetName: string, spellName?: string) => {
    return combat.attack.mutateAsync({ characterId, targetName, spellName });
  };

  const endCombatSession = async (characterId: string) => {
    await combat.endCombat.mutateAsync(characterId);
    clearCombat();
  };

  // --- Watchers ---
  // Auto-update currentTarget when combat starts or enemies change
  watch([inCombat, enemies], ([combat, enemyList]) => {
    if (combat && !currentTarget.value && enemyList.length > 0) {
      currentTarget.value = selectNextAliveTarget(enemyList);
    }
  });

  return {
    // Query data
    combatStatus,
    isLoadingCombat,
    refetchCombatStatus,

    // Computed from combat status
    inCombat,
    roundNumber,
    enemies,
    player,
    turnOrder,
    playerInitiative,
    currentTurnIndex,
    phase,
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
    isPlayerTurn,
    currentCombatant,

    // UI State
    currentTarget,
    isEndingTurn,
    showAttackResultModal,
    currentAttackResult,
    isCurrentAttackPlayerAttack,
    attackResultQueue,
    isProcessingEnemyTurn,
    currentEnemyAttackLog,
    currentPlayerAttackLog,
    currentAttackView,
    combatEndNarrative,
    isCombatEndModalOpen,

    // Constants
    PLAYER_ATTACK_DELAY_MS,

    // Actions
    startCombat,
    fetchStatus,
    endActivation,
    performAttack,
    endCombatSession,
    clearCombat,
  };
});
