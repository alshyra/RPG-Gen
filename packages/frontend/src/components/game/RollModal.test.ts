import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import {
  describe, it, beforeEach, expect, vi,
} from 'vitest';
import { useGameStore } from '@/stores/gameStore';

// create spies for composable handlers
const confirmSpy = vi.fn();
const rerollSpy = vi.fn();

vi.mock('@/composables/useGameRolls', async () => ({
  useGameRolls: () => ({
    confirmRoll: confirmSpy,
    rerollDice: rerollSpy,
  }),
}));

import RollModal from './RollModal.vue';

let piniaInstance: ReturnType<typeof createPinia>;

beforeEach(() => {
  piniaInstance = createPinia();
  setActivePinia(piniaInstance);
  confirmSpy.mockReset();
  rerollSpy.mockReset();
});

describe('RollModal', () => {
  it('displays roll data and calls handlers', async () => {
    const store = useGameStore();
    store.showRollModal = true;
    store.rollData = {
      diceNotation: '1d20',
      rolls: [12],
      bonus: 2,
      total: 14,
      skillName: 'Perception',
      advantage: 'none',
    } as any;

    const wrapper = mount(RollModal, { global: { plugins: [piniaInstance] } });

    expect(wrapper.find('[data-cy="roll-modal"]')
      .exists())
      .toBe(true);
    // d20 visual should show the computed total
    expect(wrapper.find('[data-cy="d20"]')
      .exists())
      .toBe(true);
    expect(wrapper.find('[data-cy="d20"]')
      .text())
      .toContain('14');
    expect(wrapper.text())
      .toContain('Perception');

    await wrapper.get('[data-cy="roll-reroll"]')
      .trigger('click');
    expect(rerollSpy)
      .toHaveBeenCalled();

    await wrapper.get('[data-cy="roll-send"]')
      .trigger('click');
    expect(confirmSpy)
      .toHaveBeenCalled();
  });
});
