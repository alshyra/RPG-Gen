import { describe, it, expect } from 'vitest';
import StepInventory from './StepInventory.vue';

describe('StepInventory basic import', () => {
  it('exists as a module', () => {
    expect(typeof StepInventory).toBe('object');
  });
});
