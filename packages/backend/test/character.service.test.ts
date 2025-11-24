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
  const svc = new CharacterService(FakeCharacterModel as any);
  // create is intended to initialize a draft; it takes (userId, world)
  const character = await svc.create('user-1', 'dnd');

  t.true(!character.inventory || character.inventory.length === 0, 'no inventory assigned on create');
  t.true(!character.spells || character.spells.length === 0, 'no spells assigned on create');
});

test('create returns draft character for non-spellcasters (no starter pack applied)', async (t) => {
  const svc = new CharacterService(FakeCharacterModel as any);
  const character = await svc.create('user-2', 'dnd');

  t.true(!character.inventory || character.inventory.length === 0, 'no inventory assigned on create');
  t.true(!character.spells || character.spells.length === 0, 'no spells assigned on create');
});
