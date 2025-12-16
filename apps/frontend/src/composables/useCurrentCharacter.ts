import { useCharacter } from "@rpg-gen/api-client";
import { computed } from "vue";
import { useCharacterId } from "./useCharacterId";

/**
 * Get the current character data
 * Replaces useCharacterStore().currentCharacter
 */
export function useCurrentCharacter() {
  const characterId = useCharacterId();
  const character = useCharacter(characterId);

  return computed(() => character.character.data.value);
}
