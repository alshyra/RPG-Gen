import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SpellSelector from './SpellSelector.vue';
import { useCombatStore } from '@/stores/combatStore';
import { useCharacterStore } from '@/stores/characterStore';
import type { CombatantDto } from '@rpg-gen/shared';

describe('SpellSelector', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  const mockTarget: CombatantDto = {
    id: 'goblin-1',
    name: 'Goblin',
    initiative: 5,
    isPlayer: false,
    hp: 10,
  };

  it('disables action buttons when no actions remain', async () => {
    const characterStore = useCharacterStore();
    const combatStore = useCombatStore();

    // Setup character with spells
    characterStore.currentCharacter = {
      characterId: 'char-1',
      spells: [
        {
          definitionId: 'spell-1',
          name: 'Fireball',
          level: 1,
          description: 'A powerful fire spell',
          meta: { damageDice: '3d6' },
        },
      ],
    } as any;

    // Set action economy to 0 actions remaining
    combatStore.actionRemaining = 0;
    combatStore.actionMax = 1;

    const wrapper = mount(SpellSelector, {
      props: {
        isOpen: true,
        target: mockTarget,
      },
      global: {
        plugins: [pinia],
      },
    });

    // Check weapon attack button is disabled
    const attackButton = wrapper.findAll('button')[0];
    expect(attackButton.attributes('disabled')).toBeDefined();
    expect(attackButton.classes()).toContain('bg-slate-600');
    expect(attackButton.classes()).not.toContain('bg-amber-500');

    // Check spell button is disabled
    const spellButton = wrapper.findAll('button')[1];
    expect(spellButton.attributes('disabled')).toBeDefined();
    expect(spellButton.classes()).toContain('bg-slate-600');
    expect(spellButton.classes()).not.toContain('bg-purple-600');
  });

  it('enables action buttons when actions are available', async () => {
    const characterStore = useCharacterStore();
    const combatStore = useCombatStore();

    characterStore.currentCharacter = {
      characterId: 'char-1',
      spells: [
        {
          definitionId: 'spell-1',
          name: 'Fireball',
          level: 1,
          description: 'A powerful fire spell',
          meta: { damageDice: '3d6' },
        },
      ],
    } as any;

    // Set action economy to 1 action available
    combatStore.actionRemaining = 1;
    combatStore.actionMax = 1;

    const wrapper = mount(SpellSelector, {
      props: {
        isOpen: true,
        target: mockTarget,
      },
      global: {
        plugins: [pinia],
      },
    });

    // Check weapon attack button is enabled
    const attackButton = wrapper.findAll('button')[0];
    expect(attackButton.attributes('disabled')).toBeUndefined();
    expect(attackButton.classes()).toContain('bg-amber-500');

    // Check spell button is enabled
    const spellButton = wrapper.findAll('button')[1];
    expect(spellButton.attributes('disabled')).toBeUndefined();
    expect(spellButton.classes()).toContain('bg-purple-600');
  });

  it('displays action economy counter', async () => {
    const characterStore = useCharacterStore();
    const combatStore = useCombatStore();

    characterStore.currentCharacter = {
      characterId: 'char-1',
      spells: [],
    } as any;

    combatStore.actionRemaining = 1;
    combatStore.actionMax = 1;

    const wrapper = mount(SpellSelector, {
      props: {
        isOpen: true,
        target: mockTarget,
      },
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('Actions: 1 / 1');
  });

  it('emits attack event when attack button is clicked with actions available', async () => {
    const characterStore = useCharacterStore();
    const combatStore = useCombatStore();

    characterStore.currentCharacter = {
      characterId: 'char-1',
      spells: [],
    } as any;

    combatStore.actionRemaining = 1;
    combatStore.actionMax = 1;

    const wrapper = mount(SpellSelector, {
      props: {
        isOpen: true,
        target: mockTarget,
      },
      global: {
        plugins: [pinia],
      },
    });

    const attackButton = wrapper.findAll('button')[0];
    await attackButton.trigger('click');

    expect(wrapper.emitted('attack')).toHaveLength(1);
    expect(wrapper.emitted('attack')?.[0]).toEqual([mockTarget]);
  });

  it('does not emit attack event when attack button is clicked without actions', async () => {
    const characterStore = useCharacterStore();
    const combatStore = useCombatStore();

    characterStore.currentCharacter = {
      characterId: 'char-1',
      spells: [],
    } as any;

    combatStore.actionRemaining = 0;
    combatStore.actionMax = 1;

    const wrapper = mount(SpellSelector, {
      props: {
        isOpen: true,
        target: mockTarget,
      },
      global: {
        plugins: [pinia],
      },
    });

    const attackButton = wrapper.findAll('button')[0];
    
    // Button should be disabled when no actions
    expect(attackButton.attributes('disabled')).toBeDefined();
    
    // When disabled, clicking should not trigger action emit
    // (but we still close due to click handler, so we check no attack is emitted)
    await attackButton.trigger('click');
    
    // The attack event should not be emitted because canAct is false
    expect(wrapper.emitted('attack')).toBeUndefined();
  });
});
