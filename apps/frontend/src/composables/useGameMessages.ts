import {
  type ChatMessageDto,
  type RollInstructionMessageDto,
  type HpInstructionMessageDto,
  type XpInstructionMessageDto,
  type SpellInstructionMessageDto,
  type InventoryInstructionMessageDto,
  isCombatStartInstruction,
} from "@rpg-gen/shared";
import { chatApi } from "@rpg-gen/api-client";
import { useCharacterStore } from "../stores/characterStore";
import { useGameStore } from "../stores/gameStore";
import { useCombat } from "./useCombat";

export function useGameMessages() {
  const gameStore = useGameStore();
  const combat = useCombat();

  const handleMessageResponse = (response: ChatMessageDto): void => {
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
      if (!currentCharacter.value?.characterId) {
        throw new Error("No character loaded");
      }
      const response = await chatApi.sendMessage(currentCharacter.value.characterId, {
        role: "user",
        narrative: messageText,
        instructions: [],
      });
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

  const handleXpInstruction = (instr: XpInstructionMessageDto): void => {
    const characterStore = useCharacterStore();
    if (instr.xp !== undefined) {
      gameStore.appendMessage("system", `✨ Gained ${instr.xp} XP`);
      characterStore.updateXp(instr.xp);
    }
  };

  const handleHpInstruction = (instr: HpInstructionMessageDto): void => {
    if (instr.hp !== undefined) {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      gameStore.appendMessage("system", `❤️ HP changed: ${hpChange}`);
      const characterStore = useCharacterStore();
      characterStore.updateHp(instr.hp);
      if (characterStore.isDead) characterStore.showDeathModal = true;
    }
  };

  const handleSpellInstruction = (instr: SpellInstructionMessageDto): void => {
    if (instr.type !== "spell") return;
    if (instr.action === "learn") {
      gameStore.appendMessage("system", `📖 Learned spell: ${instr.name} (Level ${instr.level})`);
      useCharacterStore().learnSpell(instr);
    } else if (instr.action === "cast") {
      gameStore.appendMessage("system", `✨ Cast spell: ${instr.name}`);
    } else if (instr.action === "forget") {
      gameStore.appendMessage("system", `🚫 Forgot spell: ${instr.name}`);
      useCharacterStore().forgetSpell(instr.name || "");
    }
  };

  const handleInventoryInstruction = (instr: InventoryInstructionMessageDto): void => {
    if (instr.type !== "inventory") return;
    if (instr.action === "add") {
      const qty = instr.quantity || 1;
      gameStore.appendMessage("system", `🎒 Added to inventory: ${instr.name} (x${qty})`);
      useCharacterStore().addInventoryItem({
        name: instr.name,
        qty,
      });
    } else if (instr.action === "remove") {
      const qty = instr.quantity || 1;
      gameStore.appendMessage("system", `🗑️ Removed from inventory: ${instr.name} (x${qty})`);
      useCharacterStore().removeInventoryItem(instr.name, qty);
    } else if (instr.action === "use") {
      gameStore.appendMessage("system", `⚡ Used item: ${instr.name}`);
      useCharacterStore().useInventoryItem(instr.name || "");
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
        handleXpInstruction(instr as XpInstructionMessageDto);
      } else if (type === "hp") {
        handleHpInstruction(instr as HpInstructionMessageDto);
      } else if (type === "spell") {
        handleSpellInstruction(instr as SpellInstructionMessageDto);
      } else if (type === "inventory") {
        handleInventoryInstruction(instr as InventoryInstructionMessageDto);
      } else if (isCombatStartInstruction(item)) {
        // Delegate to combat composable
        combat.initializeCombat(item);
      }
    });
  };

  return {
    sendMessage,
    retryLastMessage,
    processInstructions,
  };
}
