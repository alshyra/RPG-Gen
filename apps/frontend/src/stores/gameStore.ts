import { useDice } from "@rpg-gen/api-client";
import type { ChatMessageDto, DiceResultDto, GameInstructionDto } from "@rpg-gen/shared";
import { defineStore } from "pinia";
import { ref } from "vue";

type DisplayRole = "user" | "assistant" | "system";
import type { RollModalData } from "@/interfaces";

type StoredRole = "user" | "assistant" | "system";

// Map display roles to stored roles
function toStoredRole(role: DisplayRole): StoredRole {
  if (role === "assistant") return "assistant";
  if (role === "user") return "user";
  return "system";
}

/**
 * Game Store - UI state only
 *
 * This store manages game session UI state like messages, roll history,
 * pending instructions, and UI flags. Dice rolls use TanStack Query mutation.
 */
export const useGameStore = defineStore("gameStore", () => {
  // --- Query Hooks ---
  const dice = useDice();

  // --- UI State: Roll history (local state, not API-managed) ---
  const rolls = ref<DiceResultDto[]>([]);
  const latestRoll = ref<DiceResultDto | null>(null);
  const rollData = ref<RollModalData>({});
  const showRollModal = ref(false);

  // --- UI State: Game session/message/pending instruction ---
  const messages = ref<(ChatMessageDto & { timestamp?: number })[]>([]);
  const pendingInstruction = ref<GameInstructionDto | null>(null);
  const playerText = ref("");
  const isInitializing = ref(false);
  const sending = ref(false);

  // Track the last failed message for retry (e.g., when API is temporarily unavailable)
  const lastFailedMessage = ref<{
    text: string;
    error: string;
  } | null>(null);

  // --- Actions ---
  const doRoll = async (expr: string, advantage?: "advantage" | "disadvantage" | "none") => {
    const diceResultDto = await dice.roll.mutateAsync({
      expr,
      advantage: advantage || "none",
    });
    rolls.value.push(diceResultDto);
    latestRoll.value = diceResultDto;
    return diceResultDto;
  };

  const appendMessage = (role: DisplayRole, narrative: string) =>
    messages.value.push({
      role: toStoredRole(role),
      narrative,
      timestamp: Date.now(),
    });

  const updateMessages = (
    list: {
      role: DisplayRole;
      narrative: string;
    }[],
  ) => {
    messages.value = list.map(m => ({
      role: toStoredRole(m.role),
      narrative: m.narrative,
      timestamp: Date.now(),
    }));
  };

  const setLastFailedMessage = (text: string, error: string) => {
    lastFailedMessage.value = { text, error };
  };

  const clearLastFailedMessage = () => {
    lastFailedMessage.value = null;
  };

  return {
    // Dice roll state
    rolls,
    latestRoll,
    rollData,
    showRollModal,
    doRoll,

    // Session / UI state
    messages,
    pendingInstruction,
    playerText,
    isInitializing,
    sending,
    lastFailedMessage,

    // Helpers
    appendMessage,
    updateMessages,
    setLastFailedMessage,
    clearLastFailedMessage,
  };
});
