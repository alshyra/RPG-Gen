import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import StepInventory from './StepInventory.vue';

// Mock the character store so tests run in isolation and we can assert inventory updates
const currentCharacter = ref({ characterId: 'test-1', name: 'Tester', inventory: [] } as any);
const ensureBasePack = vi.fn(async () => {
  // simulate server adding base pack items
  currentCharacter.value.inventory.push({ name: 'Sac à dos', qty: 1 });
  currentCharacter.value.inventory.push({ name: 'Torche', qty: 3 });
  currentCharacter.value.inventory.push({ name: 'Rations', qty: 5 });
  currentCharacter.value.inventory.push({ name: 'Tente', qty: 1 });
  currentCharacter.value.inventory.push({ name: 'Potion de soin', qty: 3, meta: { usable: true } });
});
const chooseStarterWeapon = vi.fn(async (weaponName: string) => {
  // simulate removing other starters and adding the chosen one
  currentCharacter.value.inventory = (currentCharacter.value.inventory || []).filter((i: any) => !['Épée', 'Rapière', 'Dague', 'Bâton de mage'].includes(i.name));
  currentCharacter.value.inventory.push({ name: weaponName, qty: 1 });
});
vi.mock('@/stores/characterStore', () => ({
  useCharacterStore: () => ({
    currentCharacter,
    updateCharacter: async () => {},
    ensureBasePack,
    chooseStarterWeapon,
  }),
}));
vi.mock('@/services/characterServiceApi', () => ({
  characterServiceApi: {
    getItemDefinitions: async () => [
      { definitionId: 'weapon-sword', name: 'Épée', description: 'Lame lourde', meta: { type: 'weapon' } },
      { definitionId: 'weapon-rapiere', name: 'Rapière', description: 'Lame précise', meta: { type: 'weapon' } },
      { definitionId: 'weapon-staff', name: 'Bâton de mage', description: 'Focus', meta: { type: 'weapon' } },
    ],
  },
}));

describe('StepInventory', () => {
  it('mounts and shows base pack and weapons', async () => {
    const wrapper = mount(StepInventory, { global: { stubs: ['UiInputNumber'] } });
    expect(wrapper.exists()).toBe(true);
    // Header (less strict, avoid exact phrase match with newlines)
    expect(wrapper.text()).toContain('Choisissez votre équipement');

    // Base pack text should be present
    expect(wrapper.text()).toContain('Pack de départ');

    // Weapons should show
    expect(wrapper.text()).toContain('Épée');
    expect(wrapper.text()).toContain('Rapière');
    expect(wrapper.text()).toContain('Bâton de mage');
  });

  it('initializes the default pack on mount', async () => {
    // Ensure inventory was populated by component initialization
    expect(currentCharacter.value.inventory.length).toBeGreaterThanOrEqual(3);
    const names = currentCharacter.value.inventory.map((i: any) => i.name);
    expect(names).toContain('Sac à dos');
    expect(names).toContain('Torche');
    expect(names).toContain('Rations');
  });

  it('calls addInventoryItem when picking an available weapon', async () => {
    const wrapper = mount(StepInventory, { global: { stubs: ['UiInputNumber'] } });
    // find the first weapon checkbox and trigger update to pick it
    const weaponCheckboxes = wrapper.findAllComponents({ name: 'UiInputCheckbox' });
    // weapon checkboxes are after base pack items — pick a checkbox that corresponds to a weapon
    const weaponCheckbox = weaponCheckboxes.find(c => c.text().includes('Épée'));
    if (weaponCheckbox) {
      await weaponCheckbox.vm.$emit('update:model-value', true);
      expect(chooseStarterWeapon).toHaveBeenCalled();
    } else {
      // fallback if component text did not map correctly
      expect(true).toBe(false);
    }
  });
});
