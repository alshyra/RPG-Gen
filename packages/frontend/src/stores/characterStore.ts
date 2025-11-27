import { characterServiceApi } from '@/apis/characterApi';
import { CharacterResponseDto, ItemResponseDto, SpellInstructionDataDto, SpellResponseDto, UpdateCharacterRequestDto } from '@rpg-gen/shared';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

// eslint-disable-next-line max-statements
export const useCharacterStore = defineStore('character', () => {
  const route = useRoute();
  const currentCharacterId = computed(() => typeof route.params.characterId === 'string' ? route.params.characterId : undefined);

  const currentCharacter = ref<CharacterResponseDto>();
  const showDeathModal = ref(false);

  const isDead = computed(() => !!currentCharacter.value && (typeof currentCharacter.value.hp === 'number' ? currentCharacter.value.hp <= 0 : false));

  const updateHp = (delta: number) => {
    if (!currentCharacter.value) return;
    currentCharacter.value.hp = (currentCharacter.value.hp || 0) + delta;
    if (currentCharacter.value.hp < 0) currentCharacter.value.hp = 0;
    if (currentCharacter.value.hp === 0) currentCharacter.value.isDeceased = true;
  };

  const updateXp = (xp: number) => {
    if (!currentCharacter.value) return;
    currentCharacter.value.totalXp = (currentCharacter.value.totalXp || 0) + xp;
  };

  // inventory/spells helpers (simple implementations)
  const learnSpell = (spell: SpellInstructionDataDto) => {
    if (!currentCharacter.value) return;
    // Convert instruction to SpellDto format
    const spellDto: SpellResponseDto = {
      name: spell.name,
      level: spell.level,
      description: spell.description,
      meta: {},
    };
    // immutable update to avoid forced casts
    currentCharacter.value = {
      ...currentCharacter.value,
      spells: [
        ...(currentCharacter.value.spells || []),
        spellDto,
      ],
    };
  };

  const forgetSpell = (name: string) => {
    if (!currentCharacter.value) return;
    currentCharacter.value = {
      ...currentCharacter.value,
      spells: (currentCharacter.value.spells || [])
        .filter(s => s.name !== name),
    };
  };

  const removeInventoryItem = async (definitionId: ItemResponseDto['definitionId'], quantity: number = 1) => {
    if (!currentCharacter.value?.characterId || !definitionId) return;
    currentCharacter.value.inventory = currentCharacter.value.inventory
      ?.map((item) => {
        if (item.definitionId !== definitionId) return item;

        return {
          ...item,
          qty: (item.qty ?? 1) - quantity,
        };
      }).filter(i => (i.qty ?? 0) > 0);

    try {
      const updated = await characterServiceApi.removeInventoryItem(currentCharacter.value.characterId, definitionId, quantity);
      currentCharacter.value = updated;
    } catch (e) {
      console.error('Failed to remove inventory item', e);
      throw e;
    }
  };

  const addInventoryItem = async (item: Partial<ItemResponseDto>) => {
    if (!currentCharacter.value?.characterId || !item) return;
    try {
      const updated = await characterServiceApi.addInventoryItem(currentCharacter.value.characterId, item);
      currentCharacter.value = updated;
    } catch (e) {
      console.error('Failed to add inventory item', e);
      throw e;
    }
  };

  const useInventoryItem = async (itemIdentifier: string) => {
    if (!currentCharacter.value) return;
    const inventory = currentCharacter.value?.inventory ?? [];
    const item = inventory.find(i => i._id === itemIdentifier || i.definitionId === itemIdentifier || i.name === itemIdentifier);
    if (!item) return;

    const usable = !!item.meta?.usable || !!item.meta?.consumable;

    if (usable) return removeInventoryItem(item._id || (item.definitionId as string), 1);

    return undefined;
  };

  const grantInspiration = async (amount = 1) => {
    if (!currentCharacter.value?.characterId) return;
    try {
      const updated = await characterServiceApi.grantInspiration(currentCharacter.value.characterId, amount);
      currentCharacter.value = updated;
    } catch (e) {
      console.error('Failed to grant inspiration', e);
      throw e;
    }
  };

  const spendInspiration = async () => {
    if (!currentCharacter.value?.characterId) return;
    try {
      const updated = await characterServiceApi.spendInspiration(currentCharacter.value.characterId);
      currentCharacter.value = updated;
    } catch (e) {
      console.error('Failed to spend inspiration', e);
      throw e;
    }
  };

  const createCharacter = async (world: string) => {
    const newChar = await characterServiceApi.createCharacter(world);
    currentCharacter.value = newChar;
    return newChar;
  };

  const updateCharacter = async (characterId: string, character: UpdateCharacterRequestDto) => {
    await characterServiceApi.saveCharacter(characterId, character);
  };

  watch(currentCharacterId, async (id) => {
    if (!id) return;
    const res = await characterServiceApi.getCharacterById(id);
    currentCharacter.value = res || undefined;
  }, { immediate: true });

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
