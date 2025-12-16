import type { AttackQueueItem, AttackView } from "@/interfaces";
import type {
  CombatActionResponseDto,
  CombatantDto,
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

    // UI State Helpers (no API calls)
    clearCombat,
    resetModalState,
    processAttackLogs,
  };
});
