import { computed } from "vue";
import { useRouter } from "vue-router";
import { gameEngine } from "@/services/gameEngine";
import { useConversationStore } from "@/composables/conversationStore";
import { useGameStore } from "@/composables/gameStore";
import { useCharacterStore } from "@/composables/characterStore";

export const useConversation = () => {
  const conversation = useConversationStore();
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const router = useRouter();
  const currentCharacterId = computed(() => router.currentRoute.value.params.characterId as string);

  const processInstructions = (instructions: any[] = []) => {
    instructions.forEach((instr: any) => {
      if (instr.roll) {
        gameStore.setPendingInstruction(instr);
        conversation.appendMessage(
          "System",
          `🎲 Roll needed: ${instr.roll.dices}${
            instr.roll.modifier ? ` + ${instr.roll.modifier}` : ""
          }`
        );
      } else if (instr.xp) {
        conversation.appendMessage("System", `✨ Gained ${instr.xp} XP`);
        characterStore.updateCharacterXp(instr.xp);
      } else if (instr.hp) {
        const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
        conversation.appendMessage("System", `❤️ HP changed: ${hpChange}`);
        characterStore.updateCharacterHp(instr.hp);
        if (gameStore.isDead) gameStore.setDeathModalVisible(true);
      } else if (instr.spell) {
        if (instr.spell.action === "learn") {
          conversation.appendMessage(
            "System",
            `📖 Learned spell: ${instr.spell.name} (Level ${instr.spell.level})`
          );
          characterStore.learnSpell(instr.spell);
        } else if (instr.spell.action === "cast") {
          conversation.appendMessage("System", `✨ Cast spell: ${instr.spell.name}`);
        } else if (instr.spell.action === "forget") {
          conversation.appendMessage("System", `🚫 Forgot spell: ${instr.spell.name}`);
          characterStore.forgetSpell(instr.spell.name);
        }
      } else if (instr.inventory) {
        if (instr.inventory.action === "add") {
          const qty = instr.inventory.quantity || 1;
          conversation.appendMessage(
            "System",
            `🎒 Added to inventory: ${instr.inventory.name} (x${qty})`
          );
          characterStore.addInventoryItem(instr.inventory);
        } else if (instr.inventory.action === "remove") {
          const qty = instr.inventory.quantity || 1;
          conversation.appendMessage(
            "System",
            `🗑️ Removed from inventory: ${instr.inventory.name} (x${qty})`
          );
          characterStore.removeInventoryItem(instr.inventory.name, qty);
        } else if (instr.inventory.action === "use") {
          conversation.appendMessage("System", `⚡ Used item: ${instr.inventory.name}`);
          characterStore.useInventoryItem(instr.inventory.name);
        }
      }
    });
  };

  const sendMessage = async (): Promise<void> => {
    if (!gameStore.playerText) return;
    conversation.appendMessage("Player", gameStore.playerText);
    conversation.appendMessage("System", "...thinking...");
    gameStore.setSending(true);
    try {
      const response = await gameEngine.sendMessage(currentCharacterId.value, gameStore.playerText);
      gameStore.clearPlayerText();
      conversation.popLastMessage();
      conversation.appendMessage("GM", response.text);
      processInstructions(response.instructions);
    } catch (e: any) {
      conversation.popLastMessage();
      conversation.appendMessage("Error", e?.message || "Failed to send message");
    } finally {
      gameStore.setSending(false);
    }
  };

  return { sendMessage, processInstructions };
};
