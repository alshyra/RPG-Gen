import { INestApplication, Logger } from "@nestjs/common";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { AptitudeService } from "./bounded-contexts/spell/domain/services/AptitudeService.js";
import { ClassDefinitionService } from "./domain/class-definition/class-definition.service.js";
import { ItemDefinitionService } from "./bounded-contexts/item/domain/services/ItemDefinitionService.js";
import { RaceService } from "./domain/race/race.service.js";

// Get the directory of this file for relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// New simplified system - starter packs and aptitudes
import aptitudesData from "./seed/aptitudes.json" with { type: "json" };
import racesData from "./seed/races.json" with { type: "json" };
import starterPackItems from "./seed/starter-packs.json" with { type: "json" };

// Legacy items (still useful for the game)
import armorDefinitions from "./seed/armor-definitions.json" with { type: "json" };
import itemsDefinitions from "./seed/item-definitions.json" with { type: "json" };
import weaponsDefinitions from "./seed/weapons-definitions.json" with { type: "json" };

// Class seed files from organized structure
import guerrierStats from "./seed/classes/guerrier/stats.json" with { type: "json" };
import guerrierVoies from "./seed/classes/guerrier/voies.json" with { type: "json" };
import mageStats from "./seed/classes/mage/stats.json" with { type: "json" };
import mageVoies from "./seed/classes/mage/voies.json" with { type: "json" };
import rogueStats from "./seed/classes/rogue/stats.json" with { type: "json" };
import rogueVoies from "./seed/classes/rogue/voies.json" with { type: "json" };

const seedItemDefinitions = async (app: INestApplication, logger: Logger) => {
  try {
    const itemDefService = app.get(ItemDefinitionService);
    // Combine starter pack items with legacy items
    // Cast to ensure TypeScript accepts the slot type
    const allDefs = [
      ...starterPackItems.map(item => ({
        ...item,
        slot: item.slot as "head" | "body" | "weapon" | "accessory" | "consumable" | undefined,
      })),
      ...weaponsDefinitions,
      ...itemsDefinitions,
      ...armorDefinitions,
    ];
    await Promise.all(allDefs.map(def => itemDefService.upsert(def)));
    logger.log(`Seeded ${allDefs.length} item definitions at startup`);
  } catch (e) {
    logger.warn("Seeding item definitions failed", e);
  }
};

const seedAptitudes = async (app: INestApplication, logger: Logger) => {
  try {
    const aptitudeService = app.get(AptitudeService);
    // Cast the JSON data - seedFromJson handles any extra/missing fields gracefully
    await aptitudeService.seedFromJson(aptitudesData as Parameters<AptitudeService['seedFromJson']>[0]);
    logger.log(`Seeded ${aptitudesData.length} aptitudes at startup`);
  } catch (e) {
    logger.warn("Seeding aptitudes failed", e);
  }
};

// Type for seed data compatible with ClassDefinition
interface ClassSeedData {
  name: string;
  displayName?: string;
  description?: string;
  baseStats: { hp_base: number; hp_gain?: number; pa: number; pm: number };
  proficiencies: string[];
  startingAptitudes: string[];
  talentTrees: Record<string, { name: string; description?: string; ranks: { rank: number; aptitudeId: string; pointCost: number }[] }>;
  color?: string;
  icon?: string;
  main_stat?: string;
}

// Types for the JSON file imports
interface StatsJson {
  name: string;
  displayName: string;
  description: string;
  hp_base: number;
  hp_gain: number;
  pa: number;
  pm: number;
  main_stat: string;
  proficiencies: string[];
  startingAptitudes: string[];
  color: string;
  icon: string;
}

interface VoiesJson {
  voies: Record<string, {
    name: string;
    description?: string;
    ranks: Array<{ rank: number; aptitudeId: string; pointCost: number }>;
  }>;
}

/**
 * Build class definition from stats.json and voies.json files
 */
function buildClassDefinition(stats: StatsJson, voies: VoiesJson): ClassSeedData {
  return {
    name: stats.name,
    displayName: stats.displayName,
    description: stats.description,
    baseStats: {
      hp_base: stats.hp_base,
      hp_gain: stats.hp_gain,
      pa: stats.pa,
      pm: stats.pm,
    },
    proficiencies: stats.proficiencies,
    startingAptitudes: stats.startingAptitudes,
    talentTrees: voies.voies,
    color: stats.color,
    icon: stats.icon,
    main_stat: stats.main_stat,
  };
}

const seedClassDefinitions = async (app: INestApplication, logger: Logger) => {
  try {
    const classDefService = app.get(ClassDefinitionService);

    // Build class definitions from organized JSON files
    const classDefinitions: ClassSeedData[] = [
      buildClassDefinition(guerrierStats, guerrierVoies),
      buildClassDefinition(rogueStats, rogueVoies),
      buildClassDefinition(mageStats, mageVoies),
    ];

    // Seed new class definitions
    await Promise.all(
      classDefinitions.map(async classData => {
        try {
          await classDefService.upsert(classData);
          logger.log(`Seeded class: ${classData.name}`);
        } catch (err) {
          logger.warn(`Failed to seed class ${classData.name}: ${(err as Error).message}`);
        }
      }),
    );

    logger.log("Seeded class definitions at startup");
  } catch (e) {
    logger.warn("Seeding class definitions failed", e);
  }
};

const seedRaces = async (app: INestApplication, logger: Logger) => {
  try {
    const raceService = app.get(RaceService);
    await raceService.seedFromJson(racesData);
    logger.log(`Seeded ${racesData.length} races at startup`);
  } catch (e) {
    logger.warn("Seeding races failed", e);
  }
};

/**
 * Seed all application data (items, aptitudes, classes, races)
 */
export const seedAllData = async (app: INestApplication, logger: Logger) => {
  return Promise.all([
    seedItemDefinitions(app, logger),
    seedAptitudes(app, logger),
    seedClassDefinitions(app, logger),
    seedRaces(app, logger),
  ]);
};
