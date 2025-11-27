import { DiceThrowDto, GameInstructionDto } from '@rpg-gen/shared';
import { watch } from 'vue';
import { conversationService } from '../apis/conversationApi';
import { getSkillBonus } from '../services/skillService';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';

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

type GameStore = ReturnType<typeof useGameStore>;

const handleAdditionalRoll = (instr: GameInstructionDto, gameStore: GameStore): void => {
  if (!instr.roll) return;
  gameStore.pendingInstruction = instr;
  let message = `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` - ${instr.roll.modifier}` : ''}`;
  if (instr.roll.advantage === 'advantage') {
    message += ' (with ADVANTAGE ↑)';
  } else if (instr.roll.advantage === 'disadvantage') {
    message += ' (with DISADVANTAGE ↓)';
  }
  gameStore.appendMessage('System', message);
};

const handleAdditionalXp = (
  instr: GameInstructionDto,
  gameStore: GameStore,
  characterStore: ReturnType<typeof useCharacterStore>,
): void => {
  if (typeof instr.xp !== 'number') return;
  gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
  characterStore.updateXp(instr.xp);
};

const handleAdditionalHp = (
  instr: GameInstructionDto,
  gameStore: GameStore,
  characterStore: ReturnType<typeof useCharacterStore>,
): void => {
  if (typeof instr.hp !== 'number') return;
  const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
  gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
  characterStore.updateHp(instr.hp);
  if (characterStore.isDead) characterStore.showDeathModal = true;
};

export const useGameRolls = () => {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();

  const onDiceRolled = async (rollResult: DiceThrowDto): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const instr = gameStore.pendingInstruction.roll;
    const skillName = typeof instr.modifier === 'string' ? instr.modifier : 'Roll';
    const skillBonus
      = typeof instr.modifier === 'string'
        ? getSkillBonus(characterStore.currentCharacter ?? null, skillName)
        : typeof instr.modifier === 'number'
          ? instr.modifier
          : 0;
    gameStore.rollData = {
      skillName,
      rolls: rollResult.rolls,
      bonus: skillBonus,
      total: rollResult.total + skillBonus,
      diceNotation: instr.dices,
      advantage: rollResult.advantage,
      keptRoll: rollResult.keptRoll,
      discardedRoll: rollResult.discardedRoll,
    };
    gameStore.showRollModal = true;
  };

  watch(
    () => gameStore.latestRoll,
    (latest) => {
      if (!latest) return;
      onDiceRolled(latest);
    },
  );

  const handleRollResponse = async (response: GameResponse): Promise<void> => {
    gameStore.appendMessage('GM', response.text);
    gameStore.pendingInstruction = null;
    gameStore.showRollModal = false;
    response.instructions?.forEach((instr: GameInstructionDto) => {
      if (instr.roll) handleAdditionalRoll(instr, gameStore);
      else if (instr.xp) handleAdditionalXp(instr, gameStore, characterStore);
      else if (instr.hp) handleAdditionalHp(instr, gameStore, characterStore);
    });
  };

  const sendRollResult = async (
    rollResult: RollResult | { rolls: number[]; total: number; bonus: number; advantage?: boolean },
    skillName: string,
    criticalNote: string,
  ): Promise<void> => {
    const rollResultMsg = `[${skillName}] Roll result: ${JSON.stringify(rollResult)}${criticalNote}`;
    const response = await conversationService.sendMessage(rollResultMsg);
    await handleRollResponse(response);
  };

  const confirmRoll = async (): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const { rolls, bonus, total, skillName } = gameStore.rollData;
    if (!rolls || rolls.length === 0) return;
    const diceValue = rolls[0];
    const criticalNote = getCriticalNote(diceValue);
    gameStore.appendMessage(
      'System',
      buildRollMessage(diceValue, bonus ?? 0, skillName ?? '', total ?? 0, criticalNote),
    );
    try {
      await sendRollResult({ rolls, total: total ?? 0, bonus: bonus ?? 0, advantage: false }, skillName ?? '', criticalNote);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      gameStore.appendMessage('system', 'Failed to send roll result: ' + message);
      gameStore.showRollModal = false;
    }
  };

  const rerollDice = async (): Promise<void> => {
    // Re-run the dice expression through the backend RNG via the game store
    if (!gameStore.pendingInstruction?.roll) return;
    const instr = gameStore.pendingInstruction.roll;
    const expr = instr.dices;
    // Use the advantage/disadvantage from the instruction if specified
    const advantage = instr.advantage || 'none';
    try {
      const payload = await gameStore.doRoll(expr, advantage);
      // onDiceRolled handles mapping payload -> UI modal
      await onDiceRolled(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      gameStore.appendMessage('system', 'Reroll failed: ' + msg);
    }
  };

  return { onDiceRolled, confirmRoll, rerollDice };
};
