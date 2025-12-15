import test from 'ava';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CharacterService } from '../../src/domain/character/character.service.js';
import { LevelUpService } from '../../src/domain/character/levelup.service.js';
import { ItemDefinitionService } from '../../src/domain/item-definition/item-definition.service.js';
import { SpellDefinitionService } from '../../src/domain/spell-definition/spell-definition.service.js';
import {
  Character,
  CharacterSchema,
  ItemDefinition,
  SpellDefinition,
} from '../../src/infra/mongo/index.js';
import { ItemDefinitionSchema } from '../../src/infra/mongo/item/ItemDefinition.js';
import { SpellDefinitionSchema } from '../../src/infra/mongo/spell/SpellDefinition.js';

let mongoServer: MongoMemoryServer;
let app: any;
let characterService: CharacterService;
let levelUpService: LevelUpService;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  const moduleRef = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(mongoUri),
      MongooseModule.forFeature([
        { name: Character.name, schema: CharacterSchema },
        { name: ItemDefinition.name, schema: ItemDefinitionSchema },
        { name: SpellDefinition.name, schema: SpellDefinitionSchema },
      ]),
    ],
    providers: [CharacterService, LevelUpService, ItemDefinitionService, SpellDefinitionService],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  characterService = moduleRef.get<CharacterService>(CharacterService);
  levelUpService = moduleRef.get<LevelUpService>(LevelUpService);
});

test.after(async () => {
  await app.close();
  await mongoServer.stop();
});

test('Character created with empty selectedCombatProficiencies by default', async t => {
  const userId = new Types.ObjectId().toString();
  const world = 'dnd';

  const character = await characterService.create(userId, world);
  const dto = characterService.toCharacterDto(character);

  t.true(Array.isArray(dto.selectedCombatProficiencies));
  t.is(dto.selectedCombatProficiencies?.length, 0);
});

test('Character can be updated with selectedCombatProficiencies', async t => {
  const userId = new Types.ObjectId().toString();
  const world = 'dnd';

  const character = await characterService.create(userId, world);
  const characterId = character.characterId;

  const updated = await characterService.update(userId, characterId, {
    selectedCombatProficiencies: ['sneak-attack', 'cunning-strike'],
  });

  t.deepEqual(updated.selectedCombatProficiencies, ['sneak-attack', 'cunning-strike']);

  // Verify persistence by fetching the character again
  const fetched = await characterService.findByCharacterId(userId, characterId);
  t.deepEqual(fetched.selectedCombatProficiencies, ['sneak-attack', 'cunning-strike']);
});

test('Update selectedCombatProficiencies with validation - must be array of strings', async t => {
  const userId = new Types.ObjectId().toString();
  const world = 'dnd';

  const character = await characterService.create(userId, world);
  const characterId = character.characterId;

  // Test: invalid type should throw
  const error1 = await t.throwsAsync(() =>
    characterService.update(userId, characterId, {
      selectedCombatProficiencies: 'not-an-array' as any,
    }),
  );
  t.true(error1?.message.includes('must be an array'));

  // Test: array with non-string should throw
  const error2 = await t.throwsAsync(() =>
    characterService.update(userId, characterId, {
      selectedCombatProficiencies: ['valid-id', 123] as any,
    }),
  );
  t.true(error2?.message.includes('must be strings'));
});

test('Update selectedCombatProficiencies does not affect other fields', async t => {
  const userId = new Types.ObjectId().toString();
  const world = 'dnd';

  const character = await characterService.create(userId, world);
  const characterId = character.characterId;

  // Update name first
  await characterService.update(userId, characterId, {
    name: 'Test Character',
  });

  // Then update combat proficiencies
  const updated = await characterService.update(userId, characterId, {
    selectedCombatProficiencies: ['sneak-attack'],
  });

  t.is(updated.name, 'Test Character');
  t.deepEqual(updated.selectedCombatProficiencies, ['sneak-attack']);
});

test('Appending combat proficiencies during level-up', async t => {
  const userId = new Types.ObjectId().toString();
  const world = 'dnd';

  // Create character
  const character = await characterService.create(userId, world);
  const characterId = character.characterId;

  // Set initial class
  await characterService.update(userId, characterId, {
    classes: [
      {
        name: 'Rogue',
        level: 1,
      },
    ],
  });

  const dto1 = await characterService.findByCharacterId(userId, characterId);
  t.deepEqual(dto1.selectedCombatProficiencies, []);

  // Apply first level-up with combat selection
  const afterLevelUp1 = await levelUpService.applyLevelUp(userId, characterId, 'Rogue', {
    selectedCombatProficiencies: ['sneak-attack'],
  });

  t.deepEqual(afterLevelUp1.selectedCombatProficiencies, ['sneak-attack']);

  // Apply second level-up with different combat selection
  const afterLevelUp2 = await levelUpService.applyLevelUp(userId, characterId, 'Rogue', {
    selectedCombatProficiencies: ['cunning-strike'],
  });

  // Both should be present
  t.deepEqual(afterLevelUp2.selectedCombatProficiencies, ['sneak-attack', 'cunning-strike']);
});

test('Level-up service deduplicates selectedCombatProficiencies', async t => {
  const userId = new Types.ObjectId().toString();
  const world = 'dnd';

  const character = await characterService.create(userId, world);
  const characterId = character.characterId;

  // Set initial combat proficiencies
  await characterService.update(userId, characterId, {
    classes: [
      {
        name: 'Rogue',
        level: 1,
      },
    ],
    selectedCombatProficiencies: ['sneak-attack'],
  });

  // Apply level-up with duplicate selection
  const afterLevelUp = await levelUpService.applyLevelUp(userId, characterId, 'Rogue', {
    selectedCombatProficiencies: ['sneak-attack', 'cunning-strike'],
  });

  // Should contain all unique IDs
  t.deepEqual(afterLevelUp.selectedCombatProficiencies, ['sneak-attack', 'cunning-strike']);
});
