import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCharacterStore } from './characterStore';
import { characterServiceApi } from '@/services/characterServiceApi';

describe('characterStore inventory persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('does nothing when no current character', async () => {
    const store = useCharacterStore();
    const spy = vi.spyOn(characterServiceApi, 'addInventoryItem');
    await store.addInventoryItem({ name: 'Test' } as any);
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls API and updates store on addInventoryItem', async () => {
    const store = useCharacterStore();
    store.currentCharacter = { characterId: 'c1', name: 'Hero', world: 'dnd', portrait: '', isDeceased: false } as any;

    const mockUpdated = { ...store.currentCharacter, inventory: [{ _id: 'i1', name: 'Sword', qty: 2 }] } as any;
    const spy = vi.spyOn(characterServiceApi, 'addInventoryItem').mockResolvedValue(mockUpdated);

    await store.addInventoryItem({ name: 'Sword', quantity: 2 } as any);

    expect(spy).toHaveBeenCalledOnce();
    expect(store.currentCharacter?.inventory?.[0].name).toBe('Sword');
    expect(store.currentCharacter?.inventory?.[0].qty).toBe(2);
  });

  it('calls API and updates store on removeInventoryItem', async () => {
    const store = useCharacterStore();
    store.currentCharacter = { characterId: 'c1', name: 'Hero', world: 'dnd', portrait: '', isDeceased: false, inventory: [{ _id: 'i1', name: 'Sword', qty: 2 }] } as any;

    const mockUpdated = { ...store.currentCharacter, inventory: [] } as any;
    const spy = vi.spyOn(characterServiceApi, 'removeInventoryItem').mockResolvedValue(mockUpdated);

    await store.removeInventoryItem('Sword', 2);

    expect(spy).toHaveBeenCalledOnce();
    expect(store.currentCharacter?.inventory?.length).toBe(0);
  });
});
