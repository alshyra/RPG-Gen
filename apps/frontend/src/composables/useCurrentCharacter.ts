import { useCharacter } from "@rpg-gen/api-client";
import { useCharacterId } from "./useCharacterId";

/**
 * Get the current character data
 * Replaces useCharacterStore().currentCharacter
 */
export function useCurrentCharacter() {
  const characterId = useCharacterId();
  const character = useCharacter(characterId);

  return character.character.data;
}
