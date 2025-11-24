import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import StepInventory from './StepInventory.vue';

// Mock the character store so tests run in isolation and we can assert inventory updates
const currentCharacter = ref({ characterId: 'test-1', name: 'Tester', inventory: [] });
vi.mock('@/stores/characterStore', () => ({
  useCharacterStore: () => ({
    currentCharacter,
    updateCharacter: async () => {},
  }),
}));

describe('StepInventory', () => {
  it('mounts and shows base pack and weapons', async () => {
    const wrapper = mount(StepInventory, { global: { stubs: ['UiInputNumber'] } });
    expect(wrapper.exists()).toBe(true);
    // Header
    expect(wrapper.text()).toContain('Choisissez votre équipement de départ');

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
});
