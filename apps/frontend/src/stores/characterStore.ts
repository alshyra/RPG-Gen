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
 * Character Store - UI state only
 *
 * API data is managed by TanStack Query hooks.
 * This store only manages UI flags and actions that trigger mutations.
 */
export const useCharacterStore = defineStore("character", () => {
  const route = useRoute();
  const currentCharacterId = computed(() =>
    typeof route.params.characterId === "string" ? route.params.characterId : undefined,
  );

  // --- UI State ---
  const showDeathModal = ref(false);

  // --- Query Hooks ---
  const character = useCharacter(currentCharacterId);

  // --- Computed ---
  const isDead = computed(() => !!character.character.data.value && (character.character.data.value.hp ?? 1) <= 0);

  // --- Actions ---
  const createCharacter = async (world: string) => {
    const newChar = await character.create.mutateAsync({ world });
    return newChar;
  };

  const updateCharacter = async (characterId: string, data: UpdateCharacterRequestDto) => {
    const updated = await character.update.mutateAsync({ id: characterId, data });
    return updated;
  };

  const updateHp = async (hp: number) => {
    if (!character.character.data.value?.characterId) return;
    await character.updateHp.mutateAsync(hp);
  };

  const updateXp = async (xp: number) => {
    if (!character.character.data.value?.characterId) return;
    await character.updateXp.mutateAsync(xp);
  };

  const learnSpell = async (spell: SpellInstructionMessageDto) => {
    const currentCharacter = character.character.data.value;
    if (!currentCharacter?.characterId) return;

    // Check if spell already learned
    if (
      currentCharacter.spells &&
      currentCharacter.spells.some(s => s.definitionId === spell.definitionId)
    ) {
      return;
    }

    // Update with new spell list
    const spellDto = convertSpellInstructionToDto(spell);
    await character.update.mutateAsync({
      data: {
        spells: [...(currentCharacter.spells || []), spellDto],
      },
    });
  };

  const forgetSpell = async (name: string) => {
    const currentCharacter = character.character.data.value;
    if (!currentCharacter?.characterId) return;

    await character.update.mutateAsync({
      data: {
        spells: (currentCharacter.spells || []).filter(s => s.name !== name),
      },
    });
  };

  const grantInspiration = async (amount = 1) => {
    if (!character.character.data.value?.characterId) return;
    await character.grantInspiration.mutateAsync(amount);
  };

  const spendInspiration = async () => {
    if (!character.character.data.value?.characterId) return;
    await character.spendInspiration.mutateAsync();
  };

  const addInventoryItem = async (item: InventoryItemDto) => {
    if (!character.character.data.value?.characterId || !item || !item.definitionId) return;
    await character.addInventory.mutateAsync(item);
  };

  const removeInventoryItem = async (definitionId: string, quantity = 1) => {
    if (!character.character.data.value?.characterId || !definitionId) return;
    await character.removeInventory.mutateAsync({ itemId: definitionId, qty: quantity });
  };

  const useInventoryItem = async (itemIdentifier: string) => {
    const currentCharacter = character.character.data.value;
    if (!currentCharacter) return undefined;

    const inventory = currentCharacter.inventory ?? [];
    const item = inventory.find(
      i =>
        i._id === itemIdentifier || i.definitionId === itemIdentifier || i.name === itemIdentifier,
    );

    if (!item) return undefined;

    // Check if item is usable
    const isUsable =
      item.meta &&
      "type" in item.meta &&
      item.meta.type === "consumable" &&
      !!(item.meta as { usable?: boolean }).usable;

    if (!isUsable) return undefined;

    return removeInventoryItem(item._id ?? item.definitionId, 1);
  };

  return {
    // Query data
    currentCharacter: computed(() => character.character.data.value),
    isLoadingCharacter: character.isLoading,
    characterError: computed(() => character.character.error.value),
    refetchCharacter: character.character.refetch,

    // UI state
    showDeathModal,
    isDead,

    // Actions
    createCharacter,
    updateCharacter,
    updateHp,
    updateXp,
    learnSpell,
    forgetSpell,
    addInventoryItem,
    removeInventoryItem,
    useInventoryItem,
    grantInspiration,
    spendInspiration,
  };
});
