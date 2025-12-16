import { computed } from "vue";
import { useRoute } from "vue-router";

/**
 * Get the current character ID from route params
 * Replaces useCharacterStore().currentCharacterId
 */
export function useCharacterId() {
  const route = useRoute();
  return computed(() =>
    typeof route.params.characterId === "string" ? route.params.characterId : undefined,
  );
}
