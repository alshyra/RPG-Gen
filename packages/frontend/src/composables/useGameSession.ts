/* eslint-disable @typescript-eslint/no-explicit-any */

import { characterServiceApi } from '@/apis/characterApi';
import { useCharacterStore } from '@/stores/characterStore';
import {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  CombatStartInstructionMessageDto,
} from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { useCombat } from './useCombat';
import { useRoute, useRouter } from 'vue-router';
import { conversationService } from '../apis/conversationApi';
import { useGameStore } from '../stores/gameStore';

export const useGameSession = () => {
  const router = useRouter();
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const { currentCharacter, showDeathModal } = storeToRefs(characterStore);

  const { isInitializing } = storeToRefs(gameStore);

  const { checkCombatStatus, initializeCombat } = useCombat();

  const handleCombatStartInstruction = async (instr: CombatStartInstructionMessageDto) => {
    console.log('[useGameSession] detected combat_start in history — fetching status', instr);
    try {
      const inCombat = await checkCombatStatus();
      // If backend reports no active combat, initialize it using the provided instruction
      if (!inCombat) await initializeCombat(instr);
    } catch (e) {
      console.error('[useGameSession] failed to fetch combat status after combat_start', e);
    }
  };

  const processInstructionInMessage = async (
    instr: RollInstructionMessageDto | HpInstructionMessageDto | XpInstructionMessageDto | CombatStartInstructionMessageDto,
    isLastMessage: boolean,
  ): Promise<void> => {
    // handle combat start specially
    // be defensive about the type union so we accept other instruction shapes too
    const asAny = instr as unknown as Record<string, unknown>;
    if (asAny.type === 'combat_start') {
      // only trigger a status fetch if this is the most recent assistant message
      if (isLastMessage) await handleCombatStartInstruction(instr as unknown as CombatStartInstructionMessageDto);
      return;
    }
    if (instr.type === 'roll') {
      if (isLastMessage) gameStore.pendingInstruction = instr;
      gameStore.appendMessage(
        'system',
        `🎲 Roll needed: ${instr.dices}${instr.modifier ? ` + ${JSON.stringify(instr.modifier)}` : ''}`,
      );
    } else if (instr.type === 'xp') {
      gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
      characterStore.updateXp(instr.xp);
    } else if (instr.type === 'hp') {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
      characterStore.updateHp(instr.hp);
    }
  };

  const processHistoryMessages = (history: any[]): any[] => history.map((msg, i) => {
    const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;
    // Be defensive: normalize instructions to array (some historical entries may store a single object)
    const instrs = Array.isArray((msg).instructions)
      ? (msg).instructions
      : (msg).instructions
          ? [(msg).instructions]
          : [];
    instrs.forEach((instr: any) => processInstructionInMessage(instr, i === history.length - 1));
    return { role, narrative: msg.narrative };
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
      if (messages?.length) {
        const processed = await processHistoryMessages(messages);
        gameStore.updateMessages(processed);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      gameStore.appendMessage('system', `Error: ${msg}`);
    }
    isInitializing.value = false;
  };

  return { startGame };
};
