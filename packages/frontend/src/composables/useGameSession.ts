/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { characterServiceApi } from '@/services/characterServiceApi';
import { conversationService } from '../services/conversationService';
import { useGameStore } from '../stores/gameStore';

export const useGameSession = () => {
  const router = useRouter();
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const { currentCharacter, showDeathModal } = storeToRefs(characterStore);

  const { isInitializing } = storeToRefs(gameStore);

  const processInstructionInMessage = (instr: any, isLastMessage: boolean): void => {
    if (instr.roll) {
      if (isLastMessage) gameStore.pendingInstruction = instr;
      gameStore.appendMessage(
        'System',
        `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`,
      );
    } else if (instr.xp) {
      gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
      characterStore.updateXp(instr.xp);
    } else if (instr.hp) {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
      characterStore.updateHp(instr.hp);
    }
  };

  const processHistoryMessages = (history: any[]): any[] =>
    history.map((msg, i) => {
      const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;
      (msg as any).instructions?.forEach((instr: any) =>
        processInstructionInMessage(instr, i === history.length - 1),
      );
      return { role, text: msg.text };
    });

  const startGame = async () => {
    // If the character isn't loaded in-memory yet, try to fetch it from the API
    if (!currentCharacter?.value) {
      const route = useRoute();
      const charId = String(route.params.characterId || '');
      if (!charId) return await router.push('/home');
      try {
        const fetched = await characterServiceApi.getCharacterById(charId);
        if (!fetched) return await router.push('/home');
        // update the reactive ref so other consumers see the loaded character
        currentCharacter.value = fetched as any;
      } catch (e) {
        return await router.push('/home');
      }
    }
    isInitializing.value = true;
    try {
      if (currentCharacter.value.isDeceased) showDeathModal.value = true;
      const messages = await conversationService.startGame(currentCharacter.value);
      if (messages?.length) gameStore.updateMessages(processHistoryMessages(messages));
    } catch (e: any) {
      gameStore.appendMessage('Error', e?.response?.data?.error || e.message);
    }
    isInitializing.value = false;
  };

  return { startGame };
};
