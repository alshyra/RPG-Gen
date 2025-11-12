import { ref, toRaw } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { gameEngine } from '../services/gameEngine';
import { type RollModalData } from '../services/rollTypes';
import { getSkillBonus } from '../services/skillService';

export function useGameRolls() {
  const gameStore = useGameStore();
  const rollData = ref<RollModalData>({
    rolls: [],
    total: 0,
    bonus: 0,
    diceNotation: '',
    skillName: ''
  });

  /**
   * Handle dice roll completion - show modal
   */
  async function onDiceRolled(rollResult: any) {
    if (!gameStore.pendingInstruction?.roll) return;

    const instr = gameStore.pendingInstruction.roll;
    const skillName = instr.modifier || 'Roll';
    const skillBonus = getSkillBonus(gameStore.session.character, skillName);
    const diceValue = rollResult.diceValue || 0;

    rollData.value = {
      skillName,
      rolls: [diceValue],
      bonus: skillBonus,
      total: diceValue + skillBonus,
      diceNotation: instr.dices
    };

    gameStore.setRollModalVisible(true);
  }

  /**
   * Confirm roll and send result to backend
   */
  async function confirmRoll() {
    if (!gameStore.pendingInstruction?.roll) return;

    const diceValue = rollData.value.rolls[0];
    const bonus = rollData.value.bonus;
    const total = rollData.value.total;
    const skillName = rollData.value.skillName;

    // Detect critical success/failure
    let criticalNote = '';
    if (diceValue === 20) criticalNote = ' (CRITICAL SUCCESS - Natural 20!)';
    else if (diceValue === 1) criticalNote = ' (CRITICAL FAILURE - Natural 1!)';

    gameStore.appendMessage(
      'System',
      `Rolled: [${diceValue}] = ${diceValue}${bonus !== 0 ? ` + ${bonus}` : ''} (${skillName}) = **${total}**${criticalNote}`
    );

    try {
      const rollResult = {
        rolls: rollData.value.rolls,
        total: total,
        bonus: bonus,
        advantage: false
      };

      const rollResultMsg = `[${skillName}] Roll result: ${JSON.stringify(rollResult)}${criticalNote}`;
      const response = await gameEngine.sendMessage(rollResultMsg);
      gameStore.appendMessage('GM', response.text);
      gameStore.setPendingInstruction(null);
      gameStore.setRollModalVisible(false);

      // Handle additional instructions
      processAdditionalInstructions(response.instructions);
    } catch (e: any) {
      gameStore.appendMessage('Error', 'Failed to send roll result: ' + e.message);
      gameStore.setRollModalVisible(false);
    }
  }

  /**
   * Reroll dice (keep modal open)
   */
  async function rerollDice() {
    if (!gameStore.pendingInstruction?.roll) return;

    const instr = gameStore.pendingInstruction.roll;
    const skillName = instr.modifier || 'Roll';
    const rollResult = gameEngine.rollDice(instr.dices);
    const rawResult = toRaw(rollResult);
    const diceValue = rawResult.total;
    const skillBonus = getSkillBonus(gameStore.session.character, skillName);

    rollData.value = {
      skillName,
      rolls: [diceValue],
      bonus: skillBonus,
      total: diceValue + skillBonus,
      diceNotation: instr.dices
    };
  }

  /**
   * Process instructions from roll response
   */
  function processAdditionalInstructions(instructions: any[]) {
    for (const instr of instructions) {
      if (instr.roll) {
        gameStore.setPendingInstruction(instr);
        gameStore.appendMessage(
          'System',
          `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` - ${instr.roll.modifier}` : ''}`
        );
      } else if (instr.xp) {
        gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
        gameStore.updateCharacterXp(instr.xp);
      } else if (instr.hp) {
        const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
        gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
        gameStore.updateCharacterHp(instr.hp);
        if (gameStore.isDead) gameStore.setDeathModalVisible(true);
      }
    }
  }

  return {
    rollData,
    onDiceRolled,
    confirmRoll,
    rerollDice
  };
}
