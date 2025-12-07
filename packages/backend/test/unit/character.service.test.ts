import test from 'ava';
import { CharacterService } from '../../src/domain/character/character.service.js';

// Mock Model for Character
const createMockCharacterModel = () => {
  const mockDocs: any[] = [];

  return class MockModel {
    constructor(data: any) {
      Object.assign(this, data);
    }

    async save() {
      mockDocs.push(this);
      return this;
    }

    static async findOne(filter: any) {
      return {
        exec: async () => mockDocs.find(
          doc => doc.userId === filter.userId && doc.characterId === filter.characterId,
        ),
      };
    }

    static async findOneAndUpdate(filter: any, update: any, options: any) {
      const doc = mockDocs.find(
        d => d.userId === filter.userId && d.characterId === filter.characterId,
      );
      if (doc) {
        Object.assign(doc, update.$set);
        return doc;
      }
      return null;
    }

    static mockDocs = mockDocs;
  };
};

const createMockItemDefinitionService = () => ({
  findByDefinitionId: async () => null,
  findAll: async () => [],
});

test('CharacterService.update should persist spells field', async (t) => {
  const MockCharacterModel = createMockCharacterModel();
  const mockItemDefService = createMockItemDefinitionService();

  const service = new CharacterService(
    MockCharacterModel as any,
    mockItemDefService as any,
  );

  // Create a test character
  const userId = 'test-user';
  const characterId = service.generateCharacterId();

  const character = new MockCharacterModel({
    userId,
    characterId,
    name: 'Test Bard',
    spells: [],
  });
  await character.save();

  // Update with spells
  const testSpells = [
    {
      name: 'Moquerie cruelle',
      level: 0,
      description: 'Sort d\'attaque',
      meta: {},
    },
    {
      name: 'Charme-personne',
      level: 1,
      description: 'Charme une cible',
      meta: {},
    },
  ];

  const updated = await service.update(userId, characterId, { spells: testSpells });

  t.truthy(updated);
  t.deepEqual(updated.spells, testSpells);
  t.is(updated.spells.length, 2);
  t.is(updated.spells[0].name, 'Moquerie cruelle');
});

test('CharacterService.update should allow empty spells array', async (t) => {
  const MockCharacterModel = createMockCharacterModel();
  const mockItemDefService = createMockItemDefinitionService();

  const service = new CharacterService(
    MockCharacterModel as any,
    mockItemDefService as any,
  );

  const userId = 'test-user-2';
  const characterId = service.generateCharacterId();

  const character = new MockCharacterModel({
    userId,
    characterId,
    name: 'Test Wizard',
    spells: [
      {
        name: 'Fireball',
        level: 3,
        description: '',
        meta: {},
      },
    ],
  });
  await character.save();

  // Clear all spells
  const updated = await service.update(userId, characterId, { spells: [] });

  t.truthy(updated);
  t.deepEqual(updated.spells, []);
});

test('toCharacterDto includes spells field in returned DTO', async (t) => {
  const MockCharacterModel = createMockCharacterModel();
  const mockItemDefService = createMockItemDefinitionService();

  const service = new CharacterService(
    MockCharacterModel as any,
    mockItemDefService as any,
  );

  const userId = 'dto-test-user';
  const characterId = service.generateCharacterId();

  const savedCharacter = new MockCharacterModel({
    userId,
    characterId,
    name: 'DTO Test',
    spells: [
      {
        name: 'Test Spell',
        level: 1,
        description: '',
        meta: {},
      },
    ],
  });
  await savedCharacter.save();

  // our MockModel isn't a full CharacterDocument - cast to any for test brevity
  const dto = service.toCharacterDto(savedCharacter as any);
  t.truthy(dto.spells);
  t.is(dto.spells?.length, 1);
  t.is(dto.spells?.[0].name, 'Test Spell');
});
