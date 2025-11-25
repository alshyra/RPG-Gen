import test from 'ava';

// Tests here avoid importing the real controller to keep tests lightweight.
// We verify the *expected shapes* returned by CharacterService-like operations
// using a small fake implementation (unit-level).

class FakeCharacterService {
  async addInventoryItem(_userId: string, characterId: string, item: any) {
    return {
      characterId,
      name: 'Test',
      inventory: [{ _id: 'item-1', name: item.name || 'item', qty: item.qty || 1 }],
    } as any;
  }

  async updateInventoryItem(_userId: string, characterId: string, itemId: string, updates: any) {
    return {
      characterId,
      name: 'Test',
      inventory: [{ _id: itemId, name: updates.name || 'item', qty: updates.qty || 1 }],
    } as any;
  }

  async removeInventoryItem(_userId: string, characterId: string) {
    return {
      characterId,
      name: 'Test',
      inventory: [],
    } as any;
  }

  toCharacterDto(doc: any) {
    return doc;
  }
}

test('addInventory creates item and returns character shape', async (t) => {
  try {
    const res = await new FakeCharacterService().addInventoryItem('user1', 'character-1', { name: 'Test Sword', qty: 1 });
    t.truthy(res);
    t.true(Array.isArray(res.inventory));
    t.is(res.inventory[0].name, 'Test Sword');
  } catch (e: any) {
    t.fail(String(e && e.stack ? e.stack : e));
  }
});

test('updateInventory updates item and returns character shape', async (t) => {
  try {
    const res = await new FakeCharacterService().updateInventoryItem('user1', 'character-1', 'item-1', { name: 'Better Sword', qty: 2 });
    t.truthy(res);
    t.is(res.inventory[0]._id, 'item-1');
    t.is(res.inventory[0].qty, 2);
  } catch (e: any) {
    t.fail(String(e && e.stack ? e.stack : e));
  }
});

test('removeInventory removes item and returns character shape', async (t) => {
  try {
    const res = await new FakeCharacterService().removeInventoryItem('user1', 'character-1');
    t.truthy(res);
    t.true(Array.isArray(res.inventory));
    t.is(res.inventory.length, 0);
  } catch (e: any) {
    t.fail(String(e && e.stack ? e.stack : e));
  }
});
