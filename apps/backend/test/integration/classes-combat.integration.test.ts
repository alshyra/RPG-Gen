import test from 'ava';

import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ClassesService } from '../../src/domain/classes/classes.service.js';
import { ClassDefinitionService } from '../../src/domain/class-definition/class-definition.service.js';
import { SpellDefinitionService } from '../../src/domain/spell-definition/spell-definition.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ClassDefinition,
  ClassDefinitionSchema,
} from '../../src/infra/mongo/class/ClassDefinition.js';
import type { SneakAttackMeta } from '../../src/domain/character/types/CombatOptionMeta.js';

let mongoServer: MongoMemoryServer;
let app: any;
let classesService: ClassesService;
let classDefService: ClassDefinitionService;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  const moduleRef = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(mongoUri),
      MongooseModule.forFeature([{ name: ClassDefinition.name, schema: ClassDefinitionSchema }]),
    ],
    providers: [
      ClassesService,
      ClassDefinitionService,
      { provide: SpellDefinitionService, useValue: { findByLevel: async () => [] } },
    ],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  classesService = moduleRef.get<ClassesService>(ClassesService);
  classDefService = moduleRef.get<ClassDefinitionService>(ClassDefinitionService);

  // Seed a Rogue with combat options
  await classDefService.seedFromJson([
    {
      className: 'Rogue',
      hitDie: '1d8',
      schemaVersion: 1,
      levels: [
        { level: 1, proficiencyBonus: 2, features: [], choices: [], unlockedSpells: [] },
        { level: 2, proficiencyBonus: 2, features: [], choices: [], unlockedSpells: [] },
        { level: 3, proficiencyBonus: 2, features: [], choices: [], unlockedSpells: [] },
      ],
      combatOptionsByLevel: {
        '1': [
          {
            id: 'sneak-attack',
            name: 'Sneak Attack',
            description: '1d6 extra',
            meta: { dice: '1d6' },
          },
        ],
        '3': [{ id: 'steady-aim', name: 'Steady Aim', description: 'Bonus action give advantage' }],
      },
    },
  ]);
});

test.after(async () => {
  await app.close();
  await mongoServer.stop();
});

test('getOptionsForLevel returns combat options for Rogue', async t => {
  const persisted = await classDefService.findByName('Rogue');
  t.truthy(persisted, 'persisted class');
  t.truthy(persisted?.combatOptionsByLevel, 'combatOptionsByLevel present');

  const opts1 = await classesService.getOptionsForLevel('Rogue', 1);
  t.truthy(opts1.combatOptions!.length > 0);
  t.true(opts1.combatOptions!.some(o => o.id === 'sneak-attack'));
  const sneak = opts1.combatOptions!.find(o => o.id === 'sneak-attack');
  t.is((sneak!.meta as SneakAttackMeta).dice, '1d6');

  const opts3 = await classesService.getOptionsForLevel('Rogue', 3);
  t.true(opts3.combatOptions!.some(o => o.id === 'steady-aim'));
  t.true(opts3.combatOptions!.some(o => o.id === 'sneak-attack'));
});
