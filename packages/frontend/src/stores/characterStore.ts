import { characterApi } from '@/apis/characterApi';
import {
  CharacterResponseDto, InventoryItemDto, SpellInstructionMessageDto, SpellResponseDto, UpdateCharacterRequestDto,
} from '@rpg-gen/shared';
import { defineStore } from 'pinia';
import {
  computed, Ref, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';

// --- Module-level helper functions to reduce statements in store ---

const convertSpellInstructionToDto = (spell: SpellInstructionMessageDto): SpellResponseDto => ({
  name: spell.name,
  level: spell.level,
  description: spell.description,
  meta: {},
});

const updateInventoryQuantity = (
  inventory: InventoryItemDto[] | undefined,
  definitionId: string,
  quantity: number,
): InventoryItemDto[] => (inventory ?? [])
  .map((item) => {
    if (item.definitionId !== definitionId) return item;
    return {
      ...item,
      qty: (item.qty ?? 1) - quantity,
    };
  })
  .filter(i => (i.qty ?? 0) > 0);

const findItemByIdentifier = (
  inventory: InventoryItemDto[],
  identifier: string,
): InventoryItemDto | undefined => inventory.find(
  i => i._id === identifier || i.definitionId === identifier || i.name === identifier,
);

const isItemUsable = (item: InventoryItemDto): boolean => {
  // Check if meta is consumable type with usable property
  if (item.meta && 'type' in item.meta && item.meta.type === 'consumable') {
    return !!(item.meta as { usable?: boolean }).usable;
  }
  return false;
};

const createHpUpdater = (charRef: Ref<CharacterResponseDto | undefined>) => (delta: number) => {
  if (!charRef.value) return;
  charRef.value.hp = Math.max(0, (charRef.value.hp || 0) + delta);
  if (charRef.value.hp === 0) charRef.value.isDeceased = true;
};

const createXpUpdater = (charRef: Ref<CharacterResponseDto | undefined>) => (xp: number) => {
  if (!charRef.value) return;
  charRef.value.totalXp = (charRef.value.totalXp || 0) + xp;
};

const createSpellManager = (charRef: Ref<CharacterResponseDto | undefined>) => ({
  learn: (spell: SpellInstructionMessageDto) => {
    if (!charRef.value) return;
    charRef.value = {
      ...charRef.value,
      spells: [...(charRef.value.spells || []), convertSpellInstructionToDto(spell)],
    };
  },
  forget: (name: string) => {
    if (!charRef.value) return;
    charRef.value = {
      ...charRef.value,
      spells: (charRef.value.spells || []).filter(s => s.name !== name),
    };
  },
});

// eslint-disable-next-line max-statements
export const useCharacterStore = defineStore('character', () => {
  const route = useRoute();
  const currentCharacterId = computed(() => (typeof route.params.characterId === 'string' ? route.params.characterId : undefined));

  const currentCharacter = ref<CharacterResponseDto>();
  const showDeathModal = ref(false);

  const isDead = computed(() => !!currentCharacter.value && (currentCharacter.value.hp ?? 1) <= 0);

  const updateHp = createHpUpdater(currentCharacter);
  const updateXp = createXpUpdater(currentCharacter);

  const spellManager = createSpellManager(currentCharacter);
  const learnSpell = spellManager.learn;
  const forgetSpell = spellManager.forget;

  const removeInventoryItem = async (definitionId: InventoryItemDto['definitionId'], quantity = 1) => {
    if (!currentCharacter.value?.characterId || !definitionId) return;
    currentCharacter.value.inventory = updateInventoryQuantity(currentCharacter.value.inventory, definitionId, quantity);
    const updated = await characterApi.removeInventoryItem(currentCharacter.value.characterId, definitionId, quantity);
    currentCharacter.value = updated;
  };

  const addInventoryItem = async (item: Partial<InventoryItemDto>) => {
    if (!currentCharacter.value?.characterId || !item) return;
    const updated = await characterApi.addInventoryItem(currentCharacter.value.characterId, item);
    currentCharacter.value = updated;
  };

  const useInventoryItem = async (itemIdentifier: string) => {
    if (!currentCharacter.value) return undefined;
    const item = findItemByIdentifier(currentCharacter.value.inventory ?? [], itemIdentifier);
    if (!item || !isItemUsable(item)) return undefined;
    return removeInventoryItem(item._id ?? item.definitionId, 1);
  };

  const grantInspiration = async (amount = 1) => {
    if (!currentCharacter.value?.characterId) return;
    const updated = await characterApi.grantInspiration(currentCharacter.value.characterId, amount);
    currentCharacter.value = updated;
  };

  const spendInspiration = async () => {
    if (!currentCharacter.value?.characterId) return;
    const updated = await characterApi.spendInspiration(currentCharacter.value.characterId);
    currentCharacter.value = updated;
  };

  const createCharacter = async (world: string) => {
    const newChar = await characterApi.createCharacter(world);
    currentCharacter.value = newChar;
    return newChar;
  };

  const updateCharacter = async (characterId: string, character: UpdateCharacterRequestDto) => {
    await characterApi.saveCharacter(characterId, character);
  };

  watch(currentCharacterId, async (id) => {
    if (!id) return;
    const res = await characterApi.getCharacterById(id);
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
