import test from 'ava';
import { CharacterService } from '../src/character/character.service.js';

// Minimal fake model to emulate Mongoose document constructor + save
class FakeCharacterModel {
  data: any;
  constructor(data: any) {
    this.data = data;
    Object.assign(this, data);
  }

  async save() {
    return this;
  }
}

test('create returns a draft character with empty inventory (no starter pack)', async (t) => {
  const svc = new CharacterService(FakeCharacterModel as any, {} as any);
  // create is intended to initialize a draft; it takes (userId, world)
  const character = await svc.create('user-1', 'dnd');

  t.true(!character.inventory || character.inventory.length === 0, 'no inventory assigned on create');
  t.true(!character.spells || character.spells.length === 0, 'no spells assigned on create');
});

test('create returns draft character for non-spellcasters (no starter pack applied)', async (t) => {
  const svc = new CharacterService(FakeCharacterModel as any, {} as any);
  const character = await svc.create('user-2', 'dnd');

  t.true(!character.inventory || character.inventory.length === 0, 'no inventory assigned on create');
  t.true(!character.spells || character.spells.length === 0, 'no spells assigned on create');
});

test('addInventoryItem with definitionId uses ItemDefinitionService and persists definitionId', async (t) => {
  // Fake character document with save
  const fakeDoc: any = {
    userId: 'user-1',
    characterId: 'char-1',
    inventory: [],
    save: async function () { return this; },
  };

  // Fake model with findOne returning fakeDoc
  const FakeModel: any = {
    findOne: async function () {
      return fakeDoc;
    },
  };

  // Fake ItemDefinitionService
  const FakeItemDefSvc: any = {
    findByDefinitionId: async (id: string) => ({
      definitionId: id,
      name: 'Potion de soin',
      description: 'Soigne un peu de PV',
      meta: {
        type: 'consumable',
        usable: true,
      },
    }),
  };

  const svc = new CharacterService(FakeModel, FakeItemDefSvc);
  const updated = await svc.addInventoryItem('user-1', 'char-1', { definitionId: 'potion-health' } as any);

  t.true(Array.isArray(updated.inventory), 'inventory is an array');
  t.is(updated.inventory.length, 1, 'one item added');
  const [added] = updated.inventory;
  t.is(added.definitionId, 'potion-health');
  t.is(added.name, 'Potion de soin');
  t.is(added.description, 'Soigne un peu de PV');
  t.truthy(added.meta && added.meta.type == 'consumable' && added.meta.usable === true, 'meta usable true');
  t.is(added.qty, 1, 'qty defaults to 1');
});

test('addInventoryItem merges by definitionId if provided', async (t) => {
  const fakeDoc: any = {
    userId: 'user-1',
    characterId: 'char-1',
    inventory: [
      {
        _id: 'item-123',
        definitionId: 'potion-health',
        qty: 2,
      },
    ],
    save: async function () { return this; },
  };
  const FakeModel: any = {
    findOne: async function () {
      return fakeDoc;
    },
  };
  const FakeItemDefSvc: any = {
    findByDefinitionId: async (id: string) => ({
      definitionId: id,
      name: 'Potion de soin',
      description: 'Soigne un peu de PV',
      meta: {
        type: 'consumable',
        usable: true,
      },
    }),
  };
  const svc = new CharacterService(FakeModel, FakeItemDefSvc);
  const updated = await svc.addInventoryItem('user-1', 'char-1', {
    definitionId: 'potion-health',
    qty: 3,
  } as any);
  t.is(updated.inventory.length, 1, 'one item in inventory');
  t.is(updated.inventory[0].qty, 5, 'quantities merged by definitionId');
});

test('addInventoryItem merges when existing item has the same definitionId', async (t) => {
  const fakeDoc: any = {
    userId: 'user-1',
    characterId: 'char-2',
    inventory: [
      {
        _id: 'existing-1',
        definitionId: 'torch-def',
        name: 'Torch',
        qty: 1,
        meta: {},
      },
    ],
    save: async function () { return this; },
  };

  const FakeModel: any = {
    findOne: async function () {
      return fakeDoc;
    },
  };

  const svc = new CharacterService(FakeModel, {} as any);
  const updated = await svc.addInventoryItem('user-1', 'char-2', {
    definitionId: 'torch-def',
    qty: 1,
  } as any);

  t.is(updated.inventory.length, 1, 'still a single item');
  t.is(updated.inventory[0].qty, 2, 'quantity is increased');
});

test('addInventoryItem adds new item when definitionId is different', async (t) => {
  const fakeDoc: any = {
    userId: 'user-3',
    characterId: 'char-3',
    inventory: [
      {
        _id: 'i-1',
        definitionId: 'torch-def',
        name: 'Torch',
        qty: 1,
        meta: {},
      },
    ],
    save: async function () { return this; },
  };

  const FakeModel: any = {
    findOne: async function () {
      return fakeDoc;
    },
  };

  const FakeItemDefSvc: any = {
    findByDefinitionId: async (id: string) => ({
      definitionId: id,
      name: 'Rope',
      description: 'A rope',
      meta: {},
    }),
  };

  const svc = new CharacterService(FakeModel, FakeItemDefSvc);
  const updated = await svc.addInventoryItem('user-3', 'char-3', {
    definitionId: 'rope-def',
    qty: 1,
  });

  t.is(updated.inventory.length, 2, 'should add a separate item');
  t.is(updated.inventory[1].definitionId, 'rope-def');
});

test('addInventoryItem throws when definitionId is missing', async (t) => {
  const fakeDoc: any = {
    userId: 'user-1',
    characterId: 'char-1',
    inventory: [],
    save: async function () { return this; },
  };
  const FakeModel: any = {
    findOne: async function () {
      return fakeDoc;
    },
  };
  const svc = new CharacterService(FakeModel, {} as any);
  const error = await t.throwsAsync(async () => {
    await svc.addInventoryItem('user-1', 'char-1', { name: 'No Def' } as any);
  });
  t.truthy(error, 'should throw an error when definitionId is missing');
});
