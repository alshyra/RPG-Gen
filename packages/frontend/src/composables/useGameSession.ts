import { characterApi } from '@/apis/characterApi';
import { useCharacterStore } from '@/stores/characterStore';
import {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  CombatStartInstructionMessageDto,
  type GameInstructionDto,
  isRollInstruction,
  isHpInstruction,
  isXpInstruction,
  isCombatStartInstruction,
} from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { useCombat } from './useCombat';
import {
  useRoute, useRouter,
} from 'vue-router';
import { conversationService } from '../apis/conversationApi';
import { useGameStore } from '../stores/gameStore';

type DisplayRole = 'user' | 'assistant' | 'system';

interface HistoryMessage {
  role: 'user' | 'assistant' | 'system';
  narrative: string;
  instructions?: GameInstructionDto | GameInstructionDto[];
}

interface ProcessedMessage {
  role: DisplayRole;
  narrative: string;
}

// Type for instructions that processInstructionInMessage can handle
type ProcessableInstruction
  = | RollInstructionMessageDto
    | HpInstructionMessageDto
    | XpInstructionMessageDto
    | CombatStartInstructionMessageDto;

// Type guard to check if an instruction is processable
const isProcessableInstruction = (instr: GameInstructionDto): instr is ProcessableInstruction => isRollInstruction(instr)
  || isHpInstruction(instr)
  || isXpInstruction(instr)
  || isCombatStartInstruction(instr);

export const useGameSession = () => {
  const router = useRouter();
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const {
    currentCharacter, showDeathModal,
  } = storeToRefs(characterStore);

  const { isInitializing } = storeToRefs(gameStore);

  const { checkCombatStatus } = useCombat();

  const handleCombatStartInstruction = async (_instr: CombatStartInstructionMessageDto) => {
    try {
      // On page refresh, just restore combat state from backend
      // Do NOT call initializeCombat(instr) which would create a NEW combat
      const inCombat = await checkCombatStatus();
      if (inCombat) {
        // fetchStatus already initialized the store, just log
        gameStore.appendMessage('system', '⚔️ Combat en cours restauré.');
      } else {
        gameStore.appendMessage('system', '⚔️ Combat terminé.');
      }
    } catch (e) {
      gameStore.appendMessage('system', '⚠️ Impossible de vérifier le statut du combat.');
      console.error('[useGameSession] failed to fetch combat status after combat_start', e);
    }
  };

  const processInstructionInMessage = async (
    instr: ProcessableInstruction,
    isLastMessage: boolean,
  ): Promise<void> => {
    if (isCombatStartInstruction(instr)) {
      if (isLastMessage) await handleCombatStartInstruction(instr);
      return;
    }
    if (isRollInstruction(instr)) {
      if (isLastMessage) gameStore.pendingInstruction = instr;
      const label = instr.modifierLabel ?? '';
      const value = instr.modifierValue ?? 0;
      const modDisplay = label ? ` (${label})` : (value ? ` + ${value}` : '');
      gameStore.appendMessage(
        'system',
        `🎲 Roll needed: ${instr.dices}${modDisplay}`,
      );
    } else if (isXpInstruction(instr)) {
      gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
      characterStore.updateXp(instr.xp);
    } else if (isHpInstruction(instr)) {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
      characterStore.updateHp(instr.hp);
    }
  };

  const mapRoleToDisplay = (role: 'user' | 'assistant' | 'system'): DisplayRole => {
    if (role === 'assistant') return 'assistant';
    if (role === 'user') return 'user';
    return 'system';
  };

  const processHistoryMessages = (history: HistoryMessage[]): ProcessedMessage[] => history.map((msg, i) => {
    const instrs: GameInstructionDto[] = Array.isArray(msg.instructions)
      ? msg.instructions
      : msg.instructions
        ? [msg.instructions]
        : [];

    // Filter to only processable instructions (skip spell instructions etc.)
    instrs.filter(isProcessableInstruction)
      .forEach(instr => processInstructionInMessage(instr, i === history.length - 1));

    return {
      role: mapRoleToDisplay(msg.role),
      narrative: msg.narrative,
    };
  });

  const getCharIdFromRoute = (): string | undefined => {
    const route = useRoute();
    const charId = String(route.params.characterId || '');
    return charId || undefined;
  };

  const fetchAndSetCharacter = async (charId: string) => {
    try {
      const fetched = await characterApi.getCharacterById(charId);
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
        const processed = processHistoryMessages(messages as HistoryMessage[]);
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
