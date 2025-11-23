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

test('create assigns starter pack inventory and spells for spellcasters', async (t) => {
  const svc = new CharacterService(FakeCharacterModel as any);
  const character = await svc.create('user-1', { world: 'dnd', classes: [{ name: 'Wizard', level: 1 }], starterPack: 'mage' } as any);

  t.truthy(character.inventory && character.inventory.length > 0, 'inventory assigned');
  t.truthy(character.spells && character.spells.length > 0, 'spells assigned for wizard');
  t.true(character.spells.some((s: any) => s.name.toLowerCase().includes('magic')));
});

test('create uses basic pack and no spells for non-spellcasters', async (t) => {
  const svc = new CharacterService(FakeCharacterModel as any);
  const character = await svc.create('user-2', { world: 'dnd', classes: [{ name: 'Fighter', level: 1 }], starterPack: 'basic' } as any);

  t.truthy(character.inventory && character.inventory.length > 0, 'inventory assigned');
  t.true(!character.spells || character.spells.length === 0, 'no spells for fighter');
});
