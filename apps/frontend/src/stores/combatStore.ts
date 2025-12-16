import type { AttackQueueItem, AttackView } from "@/interfaces";
import type {
  CombatActionResponseDto,
  CombatantDto,
  CombatStartRequestDto,
  EnemyAttackLogDto,
} from "@rpg-gen/shared";
import { defineStore } from "pinia";
import { ref } from "vue";

const ENEMY_ATTACK_DELAY_MS = 800;
const PLAYER_ATTACK_DELAY_MS = 1500;

/**
 * Combat Store - UI state only
 *
 * UI state: modals, animations, processing flags, target selection
 * Combat data (enemies, player, turn order) is managed by useCharacter hooks via useCombatStatus
 */
export const useCombatStore = defineStore("combatStore", () => {
  // --- UI State only (modals, animations, processing flags) ---
  const showAttackResultModal = ref(false);
  const isCurrentAttackPlayerAttack = ref(true);
  const attackResultQueue = ref<AttackQueueItem[]>([]);
  const isProcessingEnemyTurn = ref(false);
  const currentEnemyAttackLog = ref<EnemyAttackLogDto | null>(null);
  const currentPlayerAttackLog = ref<CombatActionResponseDto | null>(null);
  const isCombatEndModalOpen = ref(false);
  const currentAttackView = ref<AttackView | null>(null);

  // --- Local UI state for target selection ---
  const currentTarget = ref<CombatantDto | null>(null);

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
    const { useCombatApi } = await import("../composables/useCombatStatus");
    const combatApi = useCombatApi();
    const response = await combatApi.startCombat.mutateAsync({ characterId, data: instruction });
    if (response.enemies && response.enemies.length > 0) {
      currentTarget.value = response.enemies[0];
    }
    return response;
  };

  const fetchStatus = async () => {
    const { useCombatApi } = await import("../composables/useCombatStatus");
    const combatApi = useCombatApi();
    await combatApi.status.refetch();
  };

  const endActivation = async (characterId: string) => {
    const { useCombatApi } = await import("../composables/useCombatStatus");
    const combatApi = useCombatApi();
    const response = await combatApi.endTurn.mutateAsync(characterId);
    if (response.attackLogs?.length) {
      await processAttackLogs(response.attackLogs);
    }
    // Auto-select next target if current is dead
    const { useCombatStatus } = await import("../composables/useCombatStatus");
    const combatStatus = useCombatStatus();
    const enemies = combatStatus.value?.enemies ?? [];
    currentTarget.value = selectNextAliveTarget(enemies);
    return response;
  };

  const performAttack = async (characterId: string, targetName: string, spellName?: string) => {
    const { useCombatApi } = await import("../composables/useCombatStatus");
    const combatApi = useCombatApi();
    return combatApi.attack.mutateAsync({ characterId, targetName, spellName });
  };

  const endCombatSession = async (characterId: string) => {
    const { useCombatApi } = await import("../composables/useCombatStatus");
    const combatApi = useCombatApi();
    await combatApi.endCombat.mutateAsync(characterId);
    clearCombat();
  };

  return {
    // UI State only
    currentTarget,
    showAttackResultModal,
    isCurrentAttackPlayerAttack,
    attackResultQueue,
    isProcessingEnemyTurn,
    currentEnemyAttackLog,
    currentPlayerAttackLog,
    currentAttackView,
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
