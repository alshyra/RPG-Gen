import { INestApplication, Logger } from "@nestjs/common";
import { ItemDefinitionService } from "./domain/item-definition/item-definition.service.js";
import { SpellDefinitionService } from "./domain/spell-definition/spell-definition.service.js";
import { ClassDefinitionService } from "./domain/class-definition/class-definition.service.js";
import weaponsDefinitions from "./seed/weapons-definitions.json" with { type: "json" };
import itemsDefinitions from "./seed/item-definitions.json" with { type: "json" };
import armorDefinitions from "./seed/armor-definitions.json" with { type: "json" };
import spellsDefinitions from "./seed/spells.json" with { type: "json" };
import barbarianDefinitions from "./seed/classes/barbarian/levels.json" with { type: "json" };
import bardDefinitions from "./seed/classes/bard/levels.json" with { type: "json" };
import clericDefinitions from "./seed/classes/cleric/levels.json" with { type: "json" };
import druidDefinitions from "./seed/classes/druid/levels.json" with { type: "json" };
import fighterDefinitions from "./seed/classes/fighter/levels.json" with { type: "json" };
import monkDefinitions from "./seed/classes/monk/levels.json" with { type: "json" };
import paladinDefinitions from "./seed/classes/paladin/levels.json" with { type: "json" };
import rangerDefinitions from "./seed/classes/ranger/levels.json" with { type: "json" };
import rogueDefinitions from "./seed/classes/rogue/levels.json" with { type: "json" };
import sorcererDefinitions from "./seed/classes/sorcerer/levels.json" with { type: "json" };
import warlockDefinitions from "./seed/classes/warlock/levels.json" with { type: "json" };
import wizardDefinitions from "./seed/classes/wizard/levels.json" with { type: "json" };

// Import spell allowedSpellsByLevel from full.json (contains name + definitionId)
import barbarianSpells from "./seed/classes/barbarian/allowed-spells.full.json" with { type: "json" };
import bardSpells from "./seed/classes/bard/allowed-spells.full.json" with { type: "json" };
import clericSpells from "./seed/classes/cleric/allowed-spells.full.json" with { type: "json" };
import druidSpells from "./seed/classes/druid/allowed-spells.full.json" with { type: "json" };
import fighterSpells from "./seed/classes/fighter/allowed-spells.full.json" with { type: "json" };
import monkSpells from "./seed/classes/monk/allowed-spells.full.json" with { type: "json" };
import paladinSpells from "./seed/classes/paladin/allowed-spells.full.json" with { type: "json" };
import rangerSpells from "./seed/classes/ranger/allowed-spells.full.json" with { type: "json" };
import rogueSpells from "./seed/classes/rogue/allowed-spells.full.json" with { type: "json" };
import sorcererSpells from "./seed/classes/sorcerer/allowed-spells.full.json" with { type: "json" };
import warlockSpells from "./seed/classes/warlock/allowed-spells.full.json" with { type: "json" };
import wizardSpells from "./seed/classes/wizard/allowed-spells.full.json" with { type: "json" };

const seedItemDefinitions = async (app: INestApplication, logger: Logger) => {
  try {
    const itemDefService = app.get(ItemDefinitionService);
    const allDefs = [...weaponsDefinitions, ...itemsDefinitions, ...armorDefinitions];
    await Promise.all(allDefs.map(def => itemDefService.upsert(def)));
    logger.log("Seeded item definitions at startup");
  } catch (e) {
    logger.warn("Seeding item definitions failed", e);
  }
};

const seedSpellDefinitions = async (app: INestApplication, logger: Logger) => {
  try {
    const spellDefService = app.get(SpellDefinitionService);
    await spellDefService.seedFromJson(spellsDefinitions);
    logger.log("Seeded spell definitions at startup");
  } catch (e) {
    logger.warn("Seeding spell definitions failed", e);
  }
};

const seedClassDefinitions = async (app: INestApplication, logger: Logger) => {
  try {
    const classDefService = app.get(ClassDefinitionService);

    // Map class definitions with their allowed spells
    const classSpellMap = [
      { def: barbarianDefinitions, spells: barbarianSpells },
      { def: bardDefinitions, spells: bardSpells },
      { def: clericDefinitions, spells: clericSpells },
      { def: druidDefinitions, spells: druidSpells },
      { def: fighterDefinitions, spells: fighterSpells },
      { def: monkDefinitions, spells: monkSpells },
      { def: paladinDefinitions, spells: paladinSpells },
      { def: rangerDefinitions, spells: rangerSpells },
      { def: rogueDefinitions, spells: rogueSpells },
      { def: sorcererDefinitions, spells: sorcererSpells },
      { def: warlockDefinitions, spells: warlockSpells },
      { def: wizardDefinitions, spells: wizardSpells },
    ];

    // Merge spell data with class definitions
    const classDataArray = classSpellMap.map(({ def, spells }) => ({
      ...def,
      allowedSpellsByLevel: spells.allowedSpellsByLevel || {},
    }));

    await classDefService.seedFromJson(classDataArray);
    logger.log("Seeded class definitions at startup");
  } catch (e) {
    logger.warn("Seeding class definitions failed", e);
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
