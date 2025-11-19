import { useGame } from '@/composables/useGame';
import { useCharacter } from '@/composables/useCharacter';

export const processGameInstructions = (instructions: any[] = [], appendMessage?: (role: string, text: string) => void) => {
  const gameStore = useGame();
  const characterStore = useCharacter();

  instructions.forEach((instr: any) => {
    if (instr.roll) {
      gameStore.setPendingInstruction(instr);
      appendMessage?.(
        'System',
        `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`,
      );
    } else if (instr.xp) {
      appendMessage?.('System', `✨ Gained ${instr.xp} XP`);
      characterStore.updateCharacterXp(instr.xp);
    } else if (instr.hp) {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      appendMessage?.('System', `❤️ HP changed: ${hpChange}`);
      characterStore.updateCharacterHp(instr.hp);
      if (gameStore.isDead) gameStore.setDeathModalVisible(true);
    } else if (instr.spell) {
      if (instr.spell.action === 'learn') {
        appendMessage?.(
          'System',
          `📖 Learned spell: ${instr.spell.name} (Level ${instr.spell.level})`,
        );
        characterStore.learnSpell(instr.spell);
      } else if (instr.spell.action === 'cast') {
        appendMessage?.('System', `✨ Cast spell: ${instr.spell.name}`);
      } else if (instr.spell.action === 'forget') {
        appendMessage?.('System', `🚫 Forgot spell: ${instr.spell.name}`);
        characterStore.forgetSpell(instr.spell.name);
      }
    } else if (instr.inventory) {
      if (instr.inventory.action === 'add') {
        const qty = instr.inventory.quantity || 1;
        appendMessage?.(
          'System',
          `🎒 Added to inventory: ${instr.inventory.name} (x${qty})`,
        );
        characterStore.addInventoryItem(instr.inventory);
      } else if (instr.inventory.action === 'remove') {
        const qty = instr.inventory.quantity || 1;
        appendMessage?.(
          'System',
          `🗑️ Removed from inventory: ${instr.inventory.name} (x${qty})`,
        );
        characterStore.removeInventoryItem(instr.inventory.name, qty);
      } else if (instr.inventory.action === 'use') {
        appendMessage?.('System', `⚡ Used item: ${instr.inventory.name}`);
        characterStore.useInventoryItem(instr.inventory.name);
      }
    }
  });
};
