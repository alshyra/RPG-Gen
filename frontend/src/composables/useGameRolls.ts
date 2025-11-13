import { ref, toRaw } from "vue";
import { useGameStore } from "../stores/gameStore";
import { gameEngine } from "../services/gameEngine";
import { type RollModalData } from "../services/rollTypes";
import { getSkillBonus } from "../services/skillService";

const getCriticalNote = (diceValue: number): string =>
  diceValue === 20
    ? " (CRITICAL SUCCESS - Natural 20!)"
    : diceValue === 1
    ? " (CRITICAL FAILURE - Natural 1!)"
    : "";

const buildRollMessage = (
  diceValue: number,
  bonus: number,
  skillName: string,
  total: number,
  criticalNote: string
): string =>
  `Rolled: [${diceValue}] = ${diceValue}${
    bonus !== 0 ? ` + ${bonus}` : ""
  } (${skillName}) = **${total}**${criticalNote}`;

const handleAdditionalRoll = (instr: any, gameStore: any): void => {
  gameStore.setPendingInstruction(instr);
  gameStore.appendMessage(
    "System",
    `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` - ${instr.roll.modifier}` : ""}`
  );
};

const handleAdditionalXp = (instr: any, gameStore: any): void => {
  gameStore.appendMessage("System", `✨ Gained ${instr.xp} XP`);
  gameStore.updateCharacterXp(instr.xp);
};

const handleAdditionalHp = (instr: any, gameStore: any): void => {
  const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
  gameStore.appendMessage("System", `❤️ HP changed: ${hpChange}`);
  gameStore.updateCharacterHp(instr.hp);
  if (gameStore.isDead) gameStore.setDeathModalVisible(true);
};

export function useGameRolls() {
  const gameStore = useGameStore();
  const rollData = ref<RollModalData>({
    rolls: [],
    total: 0,
    bonus: 0,
    diceNotation: "",
    skillName: "",
  });

  const onDiceRolled = async (rollResult: any): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const instr = gameStore.pendingInstruction.roll;
    const skillName = typeof instr.modifier === "string" ? instr.modifier : "Roll";
    const skillBonus =
      typeof instr.modifier === "string"
        ? getSkillBonus(gameStore.session.character, skillName)
        : typeof instr.modifier === "number"
        ? instr.modifier
        : 0;
    const diceValue = rollResult.diceValue || 0;
    rollData.value = {
      skillName,
      rolls: [diceValue],
      bonus: skillBonus,
      total: diceValue + skillBonus,
      diceNotation: instr.dices,
    };
    gameStore.setRollModalVisible(true);
  };

  const handleRollResponse = async (response: any): Promise<void> => {
    gameStore.appendMessage("GM", response.text);
    gameStore.setPendingInstruction(null);
    gameStore.setRollModalVisible(false);
    response.instructions?.forEach((instr: any) => {
      if (instr.roll) handleAdditionalRoll(instr, gameStore);
      else if (instr.xp) handleAdditionalXp(instr, gameStore);
      else if (instr.hp) handleAdditionalHp(instr, gameStore);
    });
  };

  const sendRollResult = async (
    rollResult: any,
    skillName: string,
    criticalNote: string
  ): Promise<void> => {
    const rollResultMsg = `[${skillName}] Roll result: ${JSON.stringify(
      rollResult
    )}${criticalNote}`;
    const response = await gameEngine.sendMessage(rollResultMsg);
    await handleRollResponse(response);
  };

  const confirmRoll = async (): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const { rolls, bonus, total, skillName } = rollData.value;
    const diceValue = rolls[0];
    const criticalNote = getCriticalNote(diceValue);
    gameStore.appendMessage(
      "System",
      buildRollMessage(diceValue, bonus, skillName, total, criticalNote)
    );
    try {
      await sendRollResult({ rolls, total, bonus, advantage: false }, skillName, criticalNote);
    } catch (e: any) {
      gameStore.appendMessage("Error", "Failed to send roll result: " + e.message);
      gameStore.setRollModalVisible(false);
    }
  };

  const rerollDice = async (): Promise<void> => {
    if (!gameStore.pendingInstruction?.roll) return;
    const instr = gameStore.pendingInstruction.roll;
    const skillName = typeof instr.modifier === "string" ? instr.modifier : "Roll";
    const diceValue = toRaw(gameEngine.rollDice(instr.dices)).total;
    const skillBonus =
      typeof instr.modifier === "string"
        ? getSkillBonus(gameStore.session.character, skillName)
        : typeof instr.modifier === "number"
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
}
