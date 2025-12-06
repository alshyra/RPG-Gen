import { mount } from '@vue/test-utils';
import {
  describe, it, expect, beforeEach,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import FighterPortrait from './FighterPortrait.vue';
import { useCombatStore } from '@/stores/combatStore';

describe('FighterPortrait attack button behaviour', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('disables attack button when player has no actions remaining', () => {
    const combatStore = useCombatStore();
    // Set state: it's player's activation but no actions
    combatStore.actionRemaining = 0;
    combatStore.turnOrder = [
      {
        id: 'player',
        isPlayer: true,
        name: 'You',
      } as any,
    ];
    combatStore.currentTurnIndex = 0;

    const fighter = {
      id: 'enemy-1',
      name: 'Goblin',
      hp: 10,
      hpMax: 10,
    } as any;

    const wrapper = mount(FighterPortrait, {
      global: { plugins: [pinia] },
      props: {
        fighter,
        isPlayer: false,
      },
    });

    const btn = wrapper.find('[data-cy="attack-button"]');
    expect(btn.exists())
      .toBe(true);
    expect(btn.attributes('disabled'))
      .toBeDefined();
  });

  it('enables attack button when player has at least one action', () => {
    const combatStore = useCombatStore();
    // Set state: it's player's activation and has action
    combatStore.actionRemaining = 1;
    combatStore.turnOrder = [
      {
        id: 'player',
        isPlayer: true,
        name: 'You',
      } as any,
    ];
    combatStore.currentTurnIndex = 0;

    const fighter = {
      id: 'enemy-1',
      name: 'Goblin',
      hp: 10,
      hpMax: 10,
    } as any;

    const wrapper = mount(FighterPortrait, {
      global: { plugins: [pinia] },
      props: {
        fighter,
        isPlayer: false,
      },
    });

    const btn = wrapper.find('[data-cy="attack-button"]');
    expect(btn.exists())
      .toBe(true);
    expect(btn.attributes('disabled'))
      .toBeUndefined();
  });
});
