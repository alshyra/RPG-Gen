import {
  setActivePinia, createPinia,
} from 'pinia';
import {
  expect, it, vi, beforeEach,
} from 'vitest';
import { useGameStore } from './gameStore';

vi.mock('@/apis/diceApi', async () => ({
  diceApi: {
    roll: vi.fn()
      .mockResolvedValue({
        rolls: [17],
        modifierValue: 0,
        total: 17,
      }),
  },
}));

beforeEach(() => {
  setActivePinia(createPinia());
});

it('doRoll should call diceService and store latest roll', async () => {
  const s = useGameStore();
  expect(s.rolls.length)
    .toBe(0);
  const payload = await s.doRoll('1d20');
  expect(payload)
    .toEqual({
      rolls: [17],
      modifierValue: 0,
      total: 17,
    });
  expect(s.latestRoll).not.toBe(null);
  expect(s.rolls.length)
    .toBe(1);
  expect(s.rolls[0])
    .toEqual({
      rolls: [17],
      modifierValue: 0,
      total: 17,
    });
});
