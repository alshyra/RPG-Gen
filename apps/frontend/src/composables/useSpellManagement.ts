import { useCharacter } from "@rpg-gen/api-client";
import type { SpellResponseDto } from "@rpg-gen/shared";

/* Note: This helper is not currently used but kept for future spell conversion needs
const convertSpellInstructionToDto = (spell: SpellInstructionMessageDto): SpellResponseDto => {
  if (!spell) throw new Error("spell is required");
  if (!spell.definitionId || typeof spell.definitionId !== "string" || !spell.definitionId.trim()) {
    throw new Error("spell.definitionId is required and must be a non-empty string");
  }
  if (!spell.name || typeof spell.name !== "string" || !spell.name.trim()) {
    throw new Error("spell.name is required and must be a non-empty string");
  }
  if (spell.level === undefined || spell.level === null || typeof spell.level !== "number") {
    throw new Error("spell.level is required and must be a number");
  }
  if (spell.meta === undefined || spell.meta === null || typeof spell.meta !== "object") {
    throw new Error("spell.meta is required and must be an object");
  }
  return {
    name: spell.name,
    level: spell.level,
    description: spell.description,
    definitionId: spell.definitionId,
    meta: spell.meta,
  };
};
*/

/**
 * Composable for spell management logic (learn/forget spells)
 * This handles the business logic of updating spell lists
 */
export function useSpellManagement(characterId: string | undefined) {
  const character = useCharacter(characterId);
  const currentCharacter = character.character.data;
  const learnSpell = async (spell: SpellResponseDto) => {
    if (!currentCharacter?.value?.characterId) return;

    // Check if spell already learned
    if (
      currentCharacter?.value?.spells &&
      currentCharacter.value.spells.some(
        existingSpell => existingSpell.definitionId === spell.definitionId,
      )
    ) {
      return;
    }

    await character.update.mutateAsync({
      spells: [...(currentCharacter.value.spells || []), spell],
    });
  };

  const forgetSpell = async (name: string) => {
    if (!currentCharacter?.value?.characterId) return;

    await character.update.mutateAsync({
      spells: (currentCharacter.value.spells || []).filter(spell => spell.name !== name),
    });
  };

  return {
    learnSpell,
    forgetSpell,
  };
}
