/* eslint-disable max-statements */
import { computed, ref, toRaw } from 'vue';
import { conversationService } from '../services/conversationService';
import { getSkillBonus } from '../services/skillService';
import { useRouter } from 'vue-router';
import { useConversationStore } from '@/stores/useConversationStore';

const getCriticalNote = (diceValue: number): string => {
  if (diceValue === 20) return ' (CRITICAL SUCCESS - Natural 20!)';
  if (diceValue === 1) return ' (CRITICAL FAILURE - Natural 1!)';
  return '';
};

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

interface RollData {
  rolls: number[];
  total: number;
  bonus: number;
  diceNotation: string;
  skillName: string;
}

export const useGameRolls = (options?: {
  appendMessage?: (role: string, text: string) => void;
  processInstructions?: (instructions?: any[]) => void;
}) => {
  const conversationStore = useConversationStore;
  if (!gameStore) throw new Error('useGameRolls requires a gameStore to be passed in options');
  const appendMessage = options?.appendMessage ?? (() => {});
  const processInstructions = options?.processInstructions ?? (() => {});
  const characterStore = options?.characterStore;
  if (!characterStore) throw new Error('useGameRolls requires a characterStore to be passed in options');
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
    appendMessage(
      'System',
      `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` - ${instr.roll.modifier}` : ''}`,
    );
  };

  const handleAdditionalXp = (instr: any): void => {
    appendMessage('System', `✨ Gained ${instr.xp} XP`);
    characterStore.updateCharacterXp(instr.xp);
  };

  const handleAdditionalHp = (instr: any): void => {
    const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
    appendMessage('System', `❤️ HP changed: ${hpChange}`);
    characterStore.updateCharacterHp(instr.hp);
    if (gameStore.isDead) gameStore.setDeathModalVisible(true);
  };

  const handleRollResponse = async (response: any): Promise<void> => {
    appendMessage('GM', response.text);
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
    const response = await conversationService.sendMessage(currentCharacterId.value, rollResultMsg);
    await handleRollResponse(response);
  };

  const confirmRoll = async (): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const { rolls, bonus, total, skillName } = rollData.value;
    const diceValue = rolls[0];
    const criticalNote = getCriticalNote(diceValue);
    appendMessage(
      'System',
      buildRollMessage(diceValue, bonus, skillName, total, criticalNote),
    );
    try {
      await sendRollResult({ rolls, total, bonus, advantage: false }, skillName, criticalNote);
    } catch (e: any) {
      appendMessage('Error', 'Failed to send roll result: ' + e.message);
      gameStore.setRollModalVisible(false);
    }
  };

  const rerollDice = async (): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const instr = gameStore.pendingInstruction.roll;
    const skillName = typeof instr.modifier === 'string' ? instr.modifier : 'Roll';
    const diceValue = toRaw(conversationService.rollDice(instr.dices)).total;
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
