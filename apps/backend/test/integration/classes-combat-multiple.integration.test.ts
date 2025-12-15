import test from 'ava';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import {
  ClassDefinition,
  ClassDefinitionSchema,
} from '../../src/infra/mongo/class/ClassDefinition.js';

import { ClassDefinitionService } from '../../src/domain/class-definition/class-definition.service.js';
import { ClassesService } from '../../src/domain/classes/classes.service.js';

let mongoServer: MongoMemoryServer;
let classesService: ClassesService;
let classDefService: ClassDefinitionService;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const moduleRef = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(uri),
      MongooseModule.forFeature([{ name: ClassDefinition.name, schema: ClassDefinitionSchema }]),
    ],
    providers: [
      ClassesService,
      ClassDefinitionService,
      {
        provide: (await import('../../src/domain/spell-definition/spell-definition.service.js'))
          .SpellDefinitionService,
        useValue: { findByLevel: async () => [] },
      },
    ],
  }).compile();

  classesService = moduleRef.get(ClassesService);
  classDefService = moduleRef.get(ClassDefinitionService);
});

import mongoose from 'mongoose';

test.after.always(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('All martial classes expose combatOptionsByLevel via getOptionsForLevel', async t => {
  const classes = ['barbarian', 'fighter', 'monk', 'paladin', 'ranger'];
  for (const cls of classes) {
    const path = join(__dirname, '..', '..', 'src', 'seed', 'classes', cls, 'levels.json');
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    await classDefService.seedFromJson([raw]);
    // pick level 1 to inspect
    const opts = await classesService.getOptionsForLevel(raw.className, 1);
    t.truthy(opts.combatOptions && opts.combatOptions.length >= 0, `${cls} returns combatOptions`);
  }
});
