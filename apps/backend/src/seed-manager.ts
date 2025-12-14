import { INestApplication, Logger } from '@nestjs/common';
import { ItemDefinitionService } from './domain/item-definition/item-definition.service.js';
import { SpellDefinitionService } from './domain/spell-definition/spell-definition.service.js';
import { ClassDefinitionService } from './domain/class-definition/class-definition.service.js';
import weaponsDefinitions from './seed/weapons-definitions.json' with { type: 'json' };
import itemsDefinitions from './seed/item-definitions.json' with { type: 'json' };
import armorDefinitions from './seed/armor-definitions.json' with { type: 'json' };
import spellsDefinitions from './seed/spells.json' with { type: 'json' };
import bardDefinitions from './seed/classes/bard/levels.json' with { type: 'json' };
import clericDefinitions from './seed/classes/cleric/levels.json' with { type: 'json' };
import barbarianDefinitions from './seed/classes/barbarian/levels.json' with { type: 'json' };

const seedItemDefinitions = async (app: INestApplication, logger: Logger) => {
  try {
    const itemDefService = app.get(ItemDefinitionService);
    const allDefs = [...weaponsDefinitions, ...itemsDefinitions, ...armorDefinitions];
    await Promise.all(allDefs.map(def => itemDefService.upsert(def)));
    logger.log('Seeded item definitions at startup');
  } catch (e) {
    logger.warn('Seeding item definitions failed', e);
  }
};

const seedSpellDefinitions = async (app: INestApplication, logger: Logger) => {
  try {
    const spellDefService = app.get(SpellDefinitionService);
    await spellDefService.seedFromJson(spellsDefinitions);
    logger.log('Seeded spell definitions at startup');
  } catch (e) {
    logger.warn('Seeding spell definitions failed', e);
  }
};

const seedClassDefinitions = async (app: INestApplication, logger: Logger) => {
  try {
    const classDefService = app.get(ClassDefinitionService);
    const classDataArray = [bardDefinitions, clericDefinitions, barbarianDefinitions];
    await classDefService.seedFromJson(classDataArray);
    logger.log('Seeded class definitions at startup');
  } catch (e) {
    logger.warn('Seeding class definitions failed', e);
  }
};

/**
 * Seed all application data (items, spells, classes, etc.)
 */
export const seedAllData = async (app: INestApplication, logger: Logger) => {
  return Promise.all([
    seedItemDefinitions(app, logger),
    seedSpellDefinitions(app, logger),
    seedClassDefinitions(app, logger),
  ]);
};
