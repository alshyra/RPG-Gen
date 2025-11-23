import { describe, it, expect } from 'vitest';
import InventoryPanel from './InventoryPanel.vue';

describe('InventoryPanel basic import', () => {
  it('exists as a module', () => {
    expect(typeof InventoryPanel).toBe('object');
  });
});
