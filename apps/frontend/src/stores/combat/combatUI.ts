/**
 * Combat UI Module - UI state for attack results, modals, animations
 * Manages: modal visibility, attack queue, result display
 */

import type { AttackQueueItem, AttackView } from "@/interfaces";
import type {
  CombatActionResponseDto,
  EnemyAttackLogDto,
} from "@rpg-gen/shared";
import { ref } from "vue";

export function createCombatUI() {
  // Modal state
  const showAttackResultModal = ref(false);
  const isCombatEndModalOpen = ref(false);
  const combatEndNarrative = ref<string>("");
  
  // Attack result display
  const currentAttackResult = ref<CombatActionResponseDto>();
  const isCurrentAttackPlayerAttack = ref(true);
  const currentAttackView = ref<AttackView | null>(null);
  
  // Attack queue and logs
  const attackResultQueue = ref<AttackQueueItem[]>([]);
  const currentEnemyAttackLog = ref<EnemyAttackLogDto | null>(null);
  const currentPlayerAttackLog = ref<CombatActionResponseDto | null>(null);
  
  // Processing flags
  const isProcessingEnemyTurn = ref(false);
  const isEndingTurn = ref(false);
  
  return {
    showAttackResultModal,
    isCombatEndModalOpen,
    combatEndNarrative,
    currentAttackResult,
    isCurrentAttackPlayerAttack,
    currentAttackView,
    attackResultQueue,
    currentEnemyAttackLog,
    currentPlayerAttackLog,
    isProcessingEnemyTurn,
    isEndingTurn,
  };
}
