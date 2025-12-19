import type { DiceResultDto, RollInstructionMessageDto, CharacterDto } from "@rpg-gen/shared";
import { isRollInstruction } from "@rpg-gen/shared";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { useChat } from "@rpg-gen/api-client";
import { useCharacterId } from "./useCharacterId";
import { useCurrentCharacter } from "./useCurrentCharacter";
import { useGameStore } from "../stores/gameStore";

/**
 * Get stat bonus for a character based on stat name
 * New simplified system uses vigor, finesse, mind, survival
 */
function getStatBonus(character: CharacterDto | null, statName: string): number {
  if (!character?.stats) return 0;
  const normalizedName = statName.toLowerCase();
  const stats = character.stats;
  
  switch (normalizedName) {
    case "vigor":
    case "vigueur":
      return stats.vigor ?? 0;
    case "finesse":
      return stats.finesse ?? 0;
    case "mind":
    case "esprit":
      return stats.mind ?? 0;
    case "survival":
    case "survie":
      return stats.survival ?? 0;
    default:
      return 0;
  }
}

export function useGameRolls() {
  const gameStore = useGameStore();
  const characterId = useCharacterId();
  const currentCharacter = useCurrentCharacter();
  const { rollData, pendingInstruction } = storeToRefs(gameStore);
  const chat = useChat(characterId);

  const buildRollData = (
    rollResult: DiceResultDto,
    instr: RollInstructionMessageDto,
    skillName: string,
    skillBonus: number,
  ) => {
    const { meta } = instr;
    return {
      skillName,
      rolls: rollResult.rolls,
      bonus: skillBonus,
      total: rollResult.total + skillBonus,
      diceNotation: instr.dices,
      advantage: instr.advantage,
      keptRoll: null,
      discardedRoll: null,
      action: meta?.action,
      target: meta?.target,
      targetAc: typeof meta?.targetAc === "number" ? meta.targetAc : null,
    };
  };

  const onDiceRolled = async (rollResult: DiceResultDto): Promise<void> => {
    const pending = gameStore.pendingInstruction;
    if (!pending || !isRollInstruction(pending)) return;
    const skillName = pending.modifierLabel ?? "Roll";
    const skillBonus = pending.modifierLabel
      ? getStatBonus(currentCharacter.value ?? null, skillName)
      : (pending.modifierValue ?? 0);
    gameStore.rollData = buildRollData(rollResult, pending, skillName, skillBonus);
    gameStore.showRollModal = true;
  };

  watch(
    () => gameStore.latestRoll,
    latest => latest && onDiceRolled(latest),
  );

  const confirmRoll = async () => {
    if (!pendingInstruction || !isRollInstruction(pendingInstruction.value)) return;
    if (!characterId.value) return;

    const message = await chat.sendMessage.mutateAsync({
      role: "user",
      narrative: `I rolled ${rollData.value?.total}`,
      instructions: [],
    });
    if (!message) throw new Error("No message returned from confirmRoll");

    return message;
  };

  const rerollDice = async (): Promise<void> => {
    if (!pendingInstruction || !isRollInstruction(pendingInstruction)) return;
    try {
      const payload = await gameStore.doRoll(
        pendingInstruction.dices,
        pendingInstruction.advantage ?? "none",
      );
      await onDiceRolled(payload);
    } catch (e) {
      gameStore.appendMessage(
        "system",
        `Reroll failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  return {
    onDiceRolled,
    confirmRoll,
    rerollDice,
  };
}
