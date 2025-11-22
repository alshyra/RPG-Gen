import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { CharacterDto } from '@rpg-gen/shared';
import { useCharacterStore } from '@/stores/characterStore';
import { gameEngine } from '../services/gameEngine';
import { storeToRefs } from 'pinia';

const processInstructionInMessage = (instr: any, isLastMessage: boolean, gameStore: any): void => {
  if (instr.roll) {
    if (isLastMessage) gameStore.setPendingInstruction(instr);
    gameStore.appendMessage(
      'System',
      `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`,
    );
  } else if (instr.xp) {
    gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
  } else if (instr.hp) {
    const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
    gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
  }
};

const processHistoryMessages = (history: any[], gameStore: any): any[] =>
  history.map((msg, i) => {
    const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;
    (msg as any).instructions?.forEach((instr: any) =>
      processInstructionInMessage(instr, i === history.length - 1, gameStore),
    );
    return { role, text: msg.text };
  });

export function useGameSession() {
  const router = useRouter();
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const { currentCharacter } = storeToRefs(characterStore);

  const startGame = async () => {
    if (!currentCharacter?.value) return await router.push('/home');
    gameStore.setWorld('dnd', 'Dungeons & Dragons');
    gameStore.setInitializing(true);
    try {
      gameStore.setCharacter(currentCharacter.value);
      if (currentCharacter.value.isDeceased) gameStore.setDeathModalVisible(true);
      const messages = await gameEngine.startGame(currentCharacter.value);
      if (messages?.length) gameStore.updateMessages(processHistoryMessages(messages, gameStore));
    } catch (e: any) {
      gameStore.appendMessage('Error', e?.response?.data?.error || e.message);
    }
    gameStore.setInitializing(false);
  };

  return { startGame };
}
