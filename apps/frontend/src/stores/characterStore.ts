import { characterApi } from "@rpg-gen/api-client";
import {
  CharacterResponseDto,
  UpdateCharacterRequestDto,
} from "@rpg-gen/shared";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { createHpUpdater, createXpUpdater, createInspirationManager } from './character/characterStats';
import { createSpellManager } from './character/characterSpells';
import { createInventoryManager } from './character/characterInventory';

// --- All helper functions moved to domain-driven modules ---
// See character/characterSpells.ts, character/characterInventory.ts, character/characterStats.ts

// eslint-disable-next-line max-statements
export const useCharacterStore = defineStore("character", () => {
  const route = useRoute();
  const currentCharacterId = computed(() =>
    typeof route.params.characterId === "string" ? route.params.characterId : undefined,
  );

  const currentCharacter = ref<CharacterResponseDto>();
  const showDeathModal = ref(false);

  const isDead = computed(() => !!currentCharacter.value && (currentCharacter.value.hp ?? 1) <= 0);

  // Domain-driven manager instances
  const updateHp = createHpUpdater(currentCharacter);
  const updateXp = createXpUpdater(currentCharacter);

  const spellManager = createSpellManager(currentCharacter);
  const learnSpell = spellManager.learn;
  const forgetSpell = spellManager.forget;

  const inventoryManager = createInventoryManager(currentCharacter);
  const addInventoryItem = inventoryManager.addInventoryItem;
  const removeInventoryItem = inventoryManager.removeInventoryItem;
  const useInventoryItem = inventoryManager.useInventoryItem;

  const inspirationManager = createInspirationManager(currentCharacter);
  const grantInspiration = inspirationManager.grantInspiration;
  const spendInspiration = inspirationManager.spendInspiration;

  const createCharacter = async (world: string) => {
    const newChar = await characterApi.create({ world });
    currentCharacter.value = newChar;
    return newChar;
  };

  const updateCharacter = async (characterId: string, character: UpdateCharacterRequestDto) => {
    const updated = await characterApi.update(characterId, character);
    // keep local store in sync with server response
    currentCharacter.value = updated;
    return updated;
  };

  watch(
    currentCharacterId,
    async id => {
      if (!id) return;
      const res = await characterApi.findOne(id);
      currentCharacter.value = res || undefined;
    },
    { immediate: true },
  );

  return {
    currentCharacter,
    showDeathModal,
    isDead,
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
