import type {
  ChatMessageDto,
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  SpellInstructionMessageDto,
  InventoryInstructionMessageDto,
} from '@rpg-gen/shared';
import { conversationService } from '../apis/conversationApi';
import {
  isCombatEndInstruction,
  isCombatStartInstruction,
} from '../apis/combatTypes';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';
import { useCombat } from './useCombat';

export function useGameMessages() {
  const gameStore = useGameStore();
  const combat = useCombat();

  const handleMessageResponse = (response: ChatMessageDto): void => {
    gameStore.messages.pop();
    gameStore.appendMessage('assistant', response.narrative);
    // Normalize instructions to an array before processing (be defensive)
    const instrs = Array.isArray(response.instructions)
      ? response.instructions
      : response.instructions
        ? [response.instructions]
        : [];
    processInstructions(instrs);
  };

  const handleMessageError = (e: unknown): void => {
    gameStore.messages.pop();
    const message = e instanceof Error ? e.message : 'Failed to send message';
    gameStore.appendMessage('system', message);
  };

  const sendMessage = async (): Promise<void> => {
    if (!gameStore.playerText) return;
    const messageText = gameStore.playerText;
    gameStore.playerText = '';
    gameStore.appendMessage('user', messageText);
    gameStore.appendMessage('system', '...thinking...');
    gameStore.sending = true;
    try {
      const response = await conversationService.sendMessage(messageText);
      handleMessageResponse(response);
    } catch (e: unknown) {
      handleMessageError(e);
    } finally {
      gameStore.sending = false;
    }
  };

  const handleRollInstruction = (instr: RollInstructionMessageDto): void => {
    if (instr.type !== 'roll') return;
    gameStore.pendingInstruction = instr;
    gameStore.appendMessage('system', `🎲 Roll needed: ${instr.dices}${instr.modifier ? ` + ${JSON.stringify(instr.modifier)}` : ''}`);
  };

  const handleXpInstruction = (instr: XpInstructionMessageDto): void => {
    const characterStore = useCharacterStore();
    if (instr.xp !== undefined) {
      gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
      characterStore.updateXp(instr.xp);
    }
  };

  const handleHpInstruction = (instr: HpInstructionMessageDto): void => {
    if (instr.hp !== undefined) {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
      const characterStore = useCharacterStore();
      characterStore.updateHp(instr.hp);
      if (characterStore.isDead) characterStore.showDeathModal = true;
    }
  };

  const handleSpellInstruction = (instr: SpellInstructionMessageDto): void => {
    if (instr.type !== 'spell') return;
    if (instr.action === 'learn') {
      gameStore.appendMessage('system', `📖 Learned spell: ${instr.name} (Level ${instr.level})`);
      useCharacterStore()
        .learnSpell(instr);
    } else if (instr.action === 'cast') {
      gameStore.appendMessage('system', `✨ Cast spell: ${instr.name}`);
    } else if (instr.action === 'forget') {
      gameStore.appendMessage('system', `🚫 Forgot spell: ${instr.name}`);
      useCharacterStore()
        .forgetSpell(instr.name || '');
    }
  };

  const handleInventoryInstruction = (instr: InventoryInstructionMessageDto): void => {
    if (instr.type !== 'inventory') return;
    if (instr.action === 'add') {
      const qty = instr.quantity || 1;
      gameStore.appendMessage('system', `🎒 Added to inventory: ${instr.name} (x${qty})`);
      useCharacterStore()
        .addInventoryItem({
          name: instr.name,
          qty,
        });
    } else if (instr.action === 'remove') {
      const qty = instr.quantity || 1;
      gameStore.appendMessage('system', `🗑️ Removed from inventory: ${instr.name} (x${qty})`);
      useCharacterStore()
        .removeInventoryItem(instr.name, qty);
    } else if (instr.action === 'use') {
      gameStore.appendMessage('system', `⚡ Used item: ${instr.name}`);
      useCharacterStore()
        .useInventoryItem(instr.name || '');
    }
  };

  const processInstructions = (instructions: unknown[]): void => {
    if (!instructions) return;
    const list = Array.isArray(instructions) ? instructions : [instructions];

    list.forEach((item) => {
      const instr = item as Record<string, unknown>;
      const type = instr.type as string | undefined;
      if (type === 'roll') {
        handleRollInstruction(instr as RollInstructionMessageDto);
      } else if (type === 'xp') {
        handleXpInstruction(instr as XpInstructionMessageDto);
      } else if (type === 'hp') {
        handleHpInstruction(instr as HpInstructionMessageDto);
      } else if (type === 'spell') {
        handleSpellInstruction(instr as SpellInstructionMessageDto);
      } else if (type === 'inventory') {
        handleInventoryInstruction(instr as InventoryInstructionMessageDto);
      } else if (isCombatStartInstruction(item)) {
        // Delegate to combat composable
        combat.initializeCombat(item);
      } else if (isCombatEndInstruction(item)) {
        // Delegate to combat composable
        combat.handleCombatEnd(
          item.combat_end.victory,
          item.combat_end.xp_gained,
          item.combat_end.enemies_defeated,
        );
      }
    });
  };

  return {
    sendMessage,
    processInstructions,
  };
}
