import { characterServiceApi } from '@/services/characterServiceApi';
import { CharacterDto } from '@rpg-gen/shared';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

// eslint-disable-next-line max-statements
export const useCharacterStore = defineStore('character', () => {
  const route = useRoute();
  const currentCharacterId = computed(() => route.params.characterId as string || undefined);

  const currentCharacter = ref<CharacterDto>();
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
  const learnSpell = (spell: any) => {
    if (!currentCharacter.value) return;
    (currentCharacter.value as any).spells = (currentCharacter.value as any).spells || [];
    (currentCharacter.value as any).spells.push(spell);
  };

  const forgetSpell = (name: string) => {
    if (!currentCharacter.value) return;
    (currentCharacter.value as any).spells = ((currentCharacter.value as any).spells || []).filter((s: any) => s.name !== name);
  };

  const addInventoryItem = async (item: any) => {
    if (!currentCharacter.value?.characterId) return;
    try {
      const updated = await characterServiceApi.addInventoryItem(currentCharacter.value.characterId, { name: item.name, qty: item.quantity || item.qty || 1, description: item.description, equipped: item.equipped, meta: item.meta });
      currentCharacter.value = updated;
    } catch (e) {
      console.error('Failed to add inventory item', e);
      // keep local state unchanged — caller can inspect http error
    }
  };

  const removeInventoryItem = async (name: string, qty = 1) => {
    if (!currentCharacter.value?.characterId) return;
    const inv = (currentCharacter.value as any).inventory || [];
    const f = inv.find((i: any) => i.name === name);
    if (!f) return;
    try {
      const updated = await characterServiceApi.removeInventoryItem(currentCharacter.value.characterId, f._id || f.id || String(f.name), qty);
      currentCharacter.value = updated;
    } catch (e) {
      console.error('Failed to remove inventory item', e);
    }
  };

  const useInventoryItem = async (name: string) => removeInventoryItem(name, 1);

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
    const newChar = await characterServiceApi.createCharacter({ world });
    currentCharacter.value = newChar;
    return newChar;
  };

  const updateCharacter = async (characterId: string, character: Partial<CharacterDto>) => {
    if (!characterId) return;
    try {
      await characterServiceApi.saveCharacter(characterId, character);
    } catch (e) {
      console.error('Failed to update character', e);
      throw e;
    }
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
