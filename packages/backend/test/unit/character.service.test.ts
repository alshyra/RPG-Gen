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

const createMockSpellDefinitionService = () => ({
  findByDefinitionId: async () => ({
    definitionId: 'spell-0-example',
    name: 'Example',
    level: 0,
    school: '',
    castingTime: '',
    range: '',
    components: '',
    description: '',
    meta: {},
  }),
  findAll: async () => [],
});

test('CharacterService.update should persist spells field', async (t) => {
  const MockCharacterModel = createMockCharacterModel();
  const mockItemDefService = createMockItemDefinitionService();

  const mockSpellDefService = createMockSpellDefinitionService();
  const service = new CharacterService(
    MockCharacterModel as any,
    mockItemDefService as any,
    mockSpellDefService as any,
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
      definitionId: 'spell-0-moquerie-cruelle',
      name: 'Moquerie cruelle',
      level: 0,
      description: 'Sort d\'attaque',
      meta: {},
    },
    {
      definitionId: 'spell-1-charme-personne',
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

  const mockSpellDefService = createMockSpellDefinitionService();
  const service = new CharacterService(
    MockCharacterModel as any,
    mockItemDefService as any,
    mockSpellDefService as any,
  );

  const userId = 'test-user-2';
  const characterId = service.generateCharacterId();

  const character = new MockCharacterModel({
    userId,
    characterId,
    name: 'Test Wizard',
    spells: [
      {
        definitionId: 'spell-3-fireball',
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

  const mockSpellDefService = createMockSpellDefinitionService();
  const service = new CharacterService(
    MockCharacterModel as any,
    mockItemDefService as any,
    mockSpellDefService as any,
  );

  const userId = 'dto-test-user';
  const characterId = service.generateCharacterId();

  const savedCharacter = new MockCharacterModel({
    userId,
    characterId,
    name: 'DTO Test',
    spells: [
      {
        definitionId: 'spell-1-test-spell',
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

test('CharacterService.update rejects spells missing definitionId', async (t) => {
  const MockCharacterModel = createMockCharacterModel();
  const mockItemDefService = createMockItemDefinitionService();
  const mockSpellDefService = createMockSpellDefinitionService();

  const service = new CharacterService(
    MockCharacterModel as any,
    mockItemDefService as any,
    mockSpellDefService as any,
  );

  const userId = 'bad-spell-user';
  const characterId = service.generateCharacterId();
  const character = new MockCharacterModel({
    userId,
    characterId,
    name: 'Bad Spell',
    spells: [],
  });
  await character.save();

  // Missing definitionId should be rejected
  const invalidSpells = [
    {
      name: 'NoIdSpell',
      level: 1,
      description: '',
      meta: {},
    },
  ];

  await t.throwsAsync(() => service.update(userId, characterId, { spells: invalidSpells as any }));
});

test('CharacterService.update rejects spells missing meta', async (t) => {
  const MockCharacterModel = createMockCharacterModel();
  const mockItemDefService = createMockItemDefinitionService();
  const mockSpellDefService = createMockSpellDefinitionService();

  const service = new CharacterService(
    MockCharacterModel as any,
    mockItemDefService as any,
    mockSpellDefService as any,
  );

  const userId = 'bad-spell-user-2';
  const characterId = service.generateCharacterId();
  const character = new MockCharacterModel({
    userId,
    characterId,
    name: 'Bad Spell 2',
    spells: [],
  });
  await character.save();

  // Missing meta should be rejected
  const invalidSpells = [
    {
      definitionId: 'spell-1-no-meta',
      name: 'NoMetaSpell',
      level: 1,
      description: '',
    },
  ];

  await t.throwsAsync(() => service.update(userId, characterId, { spells: invalidSpells as any }));
});
