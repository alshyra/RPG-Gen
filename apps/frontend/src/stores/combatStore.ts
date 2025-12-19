import type { AttackQueueItem, AttackView } from "@/interfaces";
import type { CombatActionResponseDto, EnemyAttackLogDto } from "@rpg-gen/shared";
import type { CombatEngineEventPayload } from "@rpg-gen/combat-engine";
import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";

const ENEMY_ATTACK_DELAY_MS = 800;
const PLAYER_ATTACK_DELAY_MS = 1500;

// Type for the exposed arena API from CombatArena.vue
export interface CombatArenaApi {
  init: (container?: HTMLDivElement) => Promise<void>;
  createUnit: (
    unitId: string,
    gridX: number,
    gridY: number,
    maxMoveRange: number,
    characterKey: string,
    hp: number,
    maxHp: number,
    isPlayer: boolean,
  ) => Promise<unknown>;
  clearAllUnits: () => Promise<void>;
  updateUnitHealth: (unitId: string, damage: number) => void;
  moveUnitToGrid: (unitId: string, gridX: number, gridY: number) => void;
  setupDragEvents: () => void;
  on: <T extends keyof CombatEngineEventPayload>(
    event: T,
    handler: (payload: CombatEngineEventPayload[T]) => void,
  ) => void;
  off: <T extends keyof CombatEngineEventPayload>(
    event: T,
    handler: (payload: CombatEngineEventPayload[T]) => void,
  ) => void;
  emit: <T extends keyof CombatEngineEventPayload>(
    event: T,
    payload: CombatEngineEventPayload[T],
  ) => void;
  getContainer: () => HTMLDivElement | null;
}

/**
 * Combat Store - UI state only
 *
 * UI state: modals, animations, processing flags, target selection
 * Combat data (enemies, player, turn order) is managed by useCharacter hooks via useCombatStatus
 */
export const useCombatStore = defineStore("combatStore", () => {
  // --- UI State only (modals, animations, processing flags) ---
  const isCurrentAttackPlayerAttack = ref(true);
  const attackResultQueue = ref<AttackQueueItem[]>([]);
  const isProcessingEnemyTurn = ref(false);
  const currentEnemyAttackLog = ref<EnemyAttackLogDto | null>(null);
  const currentPlayerAttackLog = ref<CombatActionResponseDto | null>(null);
  const isCombatEndModalOpen = ref(false);
  const currentAttackView = ref<AttackView | null>(null);
  const hasHandledCurrentCombatEnd = ref(false);

  // Arena API reference - stored in Pinia to ensure singleton across all module instances
  const arenaApi = shallowRef<CombatArenaApi | null>(null);

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
    currentAttackView.value = null;
    isCurrentAttackPlayerAttack.value = true;
    attackResultQueue.value = [];
    isProcessingEnemyTurn.value = false;
    currentEnemyAttackLog.value = null;
    hasHandledCurrentCombatEnd.value = false;
  };

  const clearCombat = (): void => resetModalState();

  return {
    // UI State only
    isCurrentAttackPlayerAttack,
    attackResultQueue,
    isProcessingEnemyTurn,
    currentEnemyAttackLog,
    currentPlayerAttackLog,
    currentAttackView,
    isCombatEndModalOpen,
    hasHandledCurrentCombatEnd,
    arenaApi,

    // Constants
    PLAYER_ATTACK_DELAY_MS,

    // UI State Helpers (no API calls)
    clearCombat,
    resetModalState,
    processAttackLogs,
  };
});
