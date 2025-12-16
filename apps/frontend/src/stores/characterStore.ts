import { useCharacter } from "@rpg-gen/api-client";
import type {
  UpdateCharacterRequestDto,
  SpellInstructionMessageDto,
  SpellResponseDto,
  InventoryItemDto,
} from "@rpg-gen/shared";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

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

/**
 * Character Store - Currently minimal, only tracks character context
 * 
 * All API operations go through Vue Query hooks directly (useCharacter, etc.)
 * UI state should be managed in composables/components
 * Complex business logic belongs in composables, not here
 */
export const useCharacterStore = defineStore("character", () => {
  const route = useRoute();
  const currentCharacterId = computed(() =>
    typeof route.params.characterId === "string" ? route.params.characterId : undefined,
  );

  // For now, this store is mostly empty
  // Consider if it still needs to exist as-is
  
  return {
    currentCharacterId,
  };
});
