import { useCharacterStore } from '@/composables/characterStore';
import { computed, ref, toRaw } from 'vue';
import { useGameStore } from './gameStore';
import { useConversationStore } from '@/composables/conversationStore';
import { useConversation } from '@/composables/useConversation';
// useCharacterStore already imported from '@/composables/characterStore'
import { gameEngine } from '../services/gameEngine';
import { getSkillBonus } from '../services/skillService';
import { useRouter } from 'vue-router';

const getCriticalNote = (diceValue: number): string =>
  diceValue === 20
    ? ' (CRITICAL SUCCESS - Natural 20!)'
    : diceValue === 1
      ? ' (CRITICAL FAILURE - Natural 1!)'
      : '';

const buildRollMessage = (
  diceValue: number,
  bonus: number,
  skillName: string,
  total: number,
  criticalNote: string,
): string =>
  `Rolled: [${diceValue}] = ${diceValue}${
    bonus !== 0 ? ` + ${bonus}` : ''
  } (${skillName}) = **${total}**${criticalNote}`;

// Helpers will be created within useGameRolls where conversation/character store are available
interface RollData {
  rolls: number[];
  total: number;
  bonus: number;
  diceNotation: string;
  skillName: string;
}

export const useGameRolls = () => {
  const gameStore = useGameStore();
  const conversation = useConversationStore();
  const { processInstructions } = useConversation();
  const characterStore = useCharacterStore();
  const router = useRouter();

  const currentCharacterId = computed(() => router.currentRoute.value.params.characterId as string);
  const rollData = ref<RollData>({
    rolls: [],
    total: 0,
    bonus: 0,
    diceNotation: '',
    skillName: '',
  });

  const onDiceRolled = async (rollResult: any): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const instr = gameStore.pendingInstruction.roll;
    const skillName = typeof instr.modifier === 'string' ? instr.modifier : 'Roll';
    const skillBonus
      = typeof instr.modifier === 'string'
        ? getSkillBonus(gameStore.session.character, skillName)
        : typeof instr.modifier === 'number'
          ? instr.modifier
          : 0;
    const diceValue: number = rollResult.diceValue || 0;
    rollData.value = {
      skillName,
      rolls: [diceValue],
      bonus: skillBonus,
      total: diceValue + skillBonus,
      diceNotation: instr.dices,
    };
    gameStore.setRollModalVisible(true);
  };

  const handleAdditionalRoll = (instr: any): void => {
    gameStore.setPendingInstruction(instr);
    conversation.appendMessage(
      'System',
      `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` - ${instr.roll.modifier}` : ''}`,
    );
  };

  const handleAdditionalXp = (instr: any): void => {
    conversation.appendMessage('System', `✨ Gained ${instr.xp} XP`);
    characterStore.updateCharacterXp(instr.xp);
  };

  const handleAdditionalHp = (instr: any): void => {
    const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
    conversation.appendMessage('System', `❤️ HP changed: ${hpChange}`);
    characterStore.updateCharacterHp(instr.hp);
    if (gameStore.isDead) gameStore.setDeathModalVisible(true);
  };

  const handleRollResponse = async (response: any): Promise<void> => {
    conversation.appendMessage('GM', response.text);
    gameStore.setPendingInstruction(null);
    gameStore.setRollModalVisible(false);
    response.instructions?.forEach((instr: any) => {
      if (instr.roll) handleAdditionalRoll(instr);
      else if (instr.xp) handleAdditionalXp(instr);
      else if (instr.hp) handleAdditionalHp(instr);
    });
    // Also run generic instruction processing (keeps message-specific behavior centralized)
    processInstructions(response.instructions);
  };

  const sendRollResult = async (
    rollResult: any,
    skillName: string,
    criticalNote: string,
  ): Promise<void> => {
    const rollResultMsg = `[${skillName}] Roll result: ${JSON.stringify(
      rollResult,
    )}${criticalNote}`;
    const response = await gameEngine.sendMessage(currentCharacterId.value, rollResultMsg);
    await handleRollResponse(response);
  };

  const confirmRoll = async (): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const { rolls, bonus, total, skillName } = rollData.value;
    const diceValue = rolls[0];
    const criticalNote = getCriticalNote(diceValue);
    conversation.appendMessage(
      'System',
      buildRollMessage(diceValue, bonus, skillName, total, criticalNote),
    );
    try {
      await sendRollResult({ rolls, total, bonus, advantage: false }, skillName, criticalNote);
    } catch (e: any) {
      conversation.appendMessage('Error', 'Failed to send roll result: ' + e.message);
      gameStore.setRollModalVisible(false);
    }
  };

  const rerollDice = async (): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const instr = gameStore.pendingInstruction.roll;
    const skillName = typeof instr.modifier === 'string' ? instr.modifier : 'Roll';
    const diceValue = toRaw(gameEngine.rollDice(instr.dices)).total;
    const skillBonus
      = typeof instr.modifier === 'string'
        ? getSkillBonus(gameStore.session.character, skillName)
        : typeof instr.modifier === 'number'
          ? instr.modifier
          : 0;
    rollData.value = {
      skillName,
      rolls: [diceValue],
      bonus: skillBonus,
      total: diceValue + skillBonus,
      diceNotation: instr.dices,
    };
  };

  return { rollData, onDiceRolled, confirmRoll, rerollDice };
};
