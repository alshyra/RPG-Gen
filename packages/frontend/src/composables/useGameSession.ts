/* eslint-disable @typescript-eslint/no-explicit-any */

import { characterServiceApi } from '@/apis/characterApi';
import { useCharacterStore } from '@/stores/characterStore';
import { GameInstructionDto } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { conversationService } from '../apis/conversationApi';
import { useGameStore } from '../stores/gameStore';

export const useGameSession = () => {
  const router = useRouter();
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const { currentCharacter, showDeathModal } = storeToRefs(characterStore);

  const { isInitializing } = storeToRefs(gameStore);

  const processInstructionInMessage = (instr: GameInstructionDto, isLastMessage: boolean): void => {
    if (instr.roll) {
      if (isLastMessage) gameStore.pendingInstruction = instr;
      gameStore.appendMessage(
        'system',
        `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`,
      );
    } else if (instr.xp) {
      gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
      characterStore.updateXp(instr.xp);
    } else if (instr.hp) {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
      characterStore.updateHp(instr.hp);
    }
  };

  const processHistoryMessages = (history: any[]): any[] =>
    history.map((msg, i) => {
      const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;
      (msg).instructions?.forEach((instr: any) =>
        processInstructionInMessage(instr, i === history.length - 1),
      );
      return { role, text: msg.text };
    });

  const getCharIdFromRoute = (): string | undefined => {
    const route = useRoute();
    const charId = String(route.params.characterId || '');
    return charId || undefined;
  };

  const fetchAndSetCharacter = async (charId: string) => {
    try {
      const fetched = await characterServiceApi.getCharacterById(charId);
      if (!fetched) return undefined;
      currentCharacter.value = fetched;
      return fetched;
    } catch {
      return undefined;
    }
  };

  const ensureCharacterLoaded = async () => {
    if (currentCharacter?.value) return currentCharacter.value;
    const charId = getCharIdFromRoute();
    if (!charId) {
      await router.push('/home');
      return undefined;
    }
    const fetched = await fetchAndSetCharacter(charId);
    if (!fetched) {
      await router.push('/home');
      return undefined;
    }
    return fetched;
  };

  const startGame = async () => {
    const char = await ensureCharacterLoaded();
    if (!char) return;
    isInitializing.value = true;
    try {
      if (char.isDeceased) showDeathModal.value = true;
      const messages = await conversationService.startGame(char);
      if (messages?.length) gameStore.updateMessages(processHistoryMessages(messages));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      gameStore.appendMessage('system', `Error: ${msg}`);
    }
    isInitializing.value = false;
  };

  return { startGame };
};
