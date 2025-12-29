import { useCharacter, useChat } from "@rpg-gen/api-client";
import type { NarrativeResponseDto } from "@rpg-gen/shared";
import {
  type HpInstructionMessageDto,
  type InventoryInstructionMessageDto,
  type RollInstructionMessageDto,
  type XpInstructionMessageDto,
  isCombatStartInstruction,
} from "@/types/game-instructions";
import { computed } from "vue";
import { useGameStore } from "../stores/gameStore";
import { useCombat } from "./useCombat";
import { useCurrentCharacter } from "./useCurrentCharacter";

export function useGameMessages() {
  const gameStore = useGameStore();
  const currentCharacter = useCurrentCharacter();
  const characterId = computed(() => currentCharacter?.value?.characterId);
  const chat = useChat(characterId);
  const character = useCharacter(characterId);
  const combat = useCombat();

  const handleMessageResponse = (response: NarrativeResponseDto): void => {
    gameStore.messages.pop();
    gameStore.appendMessage("assistant", response.narrative);
    // Normalize instructions to an array before processing (be defensive)
    const instrs = Array.isArray(response.instructions)
      ? response.instructions
      : response.instructions
        ? [response.instructions]
        : [];
    processInstructions(instrs);
  };

  const handleMessageError = (e: unknown, failedMessageText: string): void => {
    gameStore.messages.pop();
    const message = e instanceof Error ? e.message : "Failed to send message";
    gameStore.appendMessage("system", message);

    // Track retryable errors (503 Temporarily Unavailable)
    const isRetryable =
      message.includes("temporarily unavailable") || message.includes("Gemini API");
    if (isRetryable) {
      gameStore.setLastFailedMessage(failedMessageText, message);
    }
  };

  const sendMessage = async (): Promise<void> => {
    if (!gameStore.playerText) return;
    const messageText = gameStore.playerText;
    gameStore.playerText = "";
    gameStore.appendMessage("user", messageText);
    gameStore.appendMessage("system", "...thinking...");
    gameStore.sending = true;
    try {
      if (!currentCharacter?.value?.characterId) {
        throw new Error("No character loaded");
      }
      const response = await chat.sendMessage.mutateAsync(messageText);
      gameStore.clearLastFailedMessage();
      handleMessageResponse(response);
    } catch (e: unknown) {
      handleMessageError(e, messageText);
    } finally {
      gameStore.sending = false;
    }
  };

  const retryLastMessage = async (): Promise<void> => {
    const failed = gameStore.lastFailedMessage;
    if (!failed) return;

    gameStore.clearLastFailedMessage();
    gameStore.playerText = failed.text;
    await sendMessage();
  };

  const handleRollInstruction = (instr: RollInstructionMessageDto): void => {
    if (instr.type !== "roll") return;
    gameStore.pendingInstruction = instr;
    const label = instr.modifierLabel ?? "";
    const value = instr.modifierValue ?? 0;
    const modDisplay = label ? ` (${label})` : value ? ` + ${value}` : "";
    gameStore.appendMessage("system", `🎲 Roll needed: ${instr.dices}${modDisplay}`);
  };

  const handleXpInstruction = async (instr: XpInstructionMessageDto): Promise<void> => {
    if (instr.xp !== undefined) {
      gameStore.appendMessage("system", `✨ Gained ${instr.xp} XP`);
      await character.updateXp.mutateAsync(instr.xp);
    }
  };

  const handleHpInstruction = async (instr: HpInstructionMessageDto): Promise<void> => {
    if (instr.hp !== undefined) {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      gameStore.appendMessage("system", `❤️ HP changed: ${hpChange}`);
      await character.updateHp.mutateAsync(instr.hp);
    }
  };

  const handleInventoryInstruction = async (
    instr: InventoryInstructionMessageDto,
  ): Promise<void> => {
    if (instr.type !== "inventory") return;
    if (instr.action === "add") {
      const qty = instr.quantity || 1;
      gameStore.appendMessage("system", `🎒 Added to inventory: ${instr.name} (x${qty})`);
      await character.addInventory.mutateAsync({
        definitionId: instr.name,
        name: instr.name,
        qty,
        description: "",
        equipped: false,
        meta: { type: "consumable" },
      });
    } else if (instr.action === "remove") {
      const qty = instr.quantity || 1;
      gameStore.appendMessage("system", `🗑️ Removed from inventory: ${instr.name} (x${qty})`);
      await character.removeInventory.mutateAsync({ itemId: instr.name, qty });
    } else if (instr.action === "use") {
      gameStore.appendMessage("system", `⚡ Used item: ${instr.name}`);
      throw new Error("Not implemented: use inventory item");
    }
  };

  const processInstructions = (instructions: unknown[]): void => {
    if (!instructions) return;
    const list = Array.isArray(instructions) ? instructions : [instructions];

    list.forEach(item => {
      const instr = item as Record<string, unknown>;
      const type = instr.type as string | undefined;
      if (type === "roll") {
        handleRollInstruction(instr as RollInstructionMessageDto);
      } else if (type === "xp") {
        void handleXpInstruction(instr as XpInstructionMessageDto);
      } else if (type === "hp") {
        void handleHpInstruction(instr as HpInstructionMessageDto);
      } else if (type === "inventory") {
        void handleInventoryInstruction(instr as InventoryInstructionMessageDto);
      } else if (isCombatStartInstruction(item)) {
        // Delegate to combat composable
        void combat.initializeCombat(item);
      }
    });
  };

  return {
    sendMessage,
    retryLastMessage,
    processInstructions,
  };
}
