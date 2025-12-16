import { useCharacter } from "@rpg-gen/api-client";
import { computed, type ComputedRef } from "vue";
import { useCharacterId } from "./useCharacterId";
import type { CharacterResponseDto } from "@rpg-gen/shared";

/**
 * Get the current character data
 * Replaces useCharacterStore().currentCharacter
 * Returns a Computed ref that tracks character query data
 */
export function useCurrentCharacter(): ComputedRef<CharacterResponseDto | undefined> {
  const characterId = useCharacterId();
  const character = useCharacter(characterId);

  // Return computed that depends on the query data
  return computed(() => character.character.data.value);
}
