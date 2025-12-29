import { Injectable, Logger } from '@nestjs/common';
import { ClassDataService } from '../../application/services/ClassDataService.js';
import { RaceDataService } from '../../application/services/RaceDataService.js';
import { AptitudeDataService } from '../../application/services/AptitudeDataService.js';
import { ItemDataService } from '../../application/services/ItemDataService.js';
import { EnemyDataService } from '../../application/services/EnemyDataService.js';

// Import seed data from JSON files
import aptitudesData from '../../assets/aptitudes.json' with { type: 'json' };
import racesData from '../../assets/races.json' with { type: 'json' };
import starterPackItems from '../../assets/items/starter-packs.json' with { type: 'json' };
import armorDefinitions from '../../assets/items/armor-definitions.json' with { type: 'json' };
import itemsDefinitions from '../../assets/items/item-definitions.json' with { type: 'json' };
import weaponsDefinitions from '../../assets/items/weapons-definitions.json' with { type: 'json' };
import enemiesData from '../../assets/enemies.json' with { type: 'json' };

// Class seed files
import guerrierStats from '../../assets/classes/guerrier/stats.json' with { type: 'json' };
import guerrierVoies from '../../assets/classes/guerrier/voies.json' with { type: 'json' };
import mageStats from '../../assets/classes/mage/stats.json' with { type: 'json' };
import mageVoies from '../../assets/classes/mage/voies.json' with { type: 'json' };
import rogueStats from '../../assets/classes/rogue/stats.json' with { type: 'json' };
import rogueVoies from '../../assets/classes/rogue/voies.json' with { type: 'json' };

/**
 * Responsible for seeding all game data from JSON files
 * Called once at application startup
 * 
 * @infrastructure game-data
 */
@Injectable()
export class GameDataSeeder {
  private readonly logger = new Logger(GameDataSeeder.name);

  constructor(
    private readonly classService: ClassDataService,
    private readonly raceService: RaceDataService,
    private readonly aptitudeService: AptitudeDataService,
    private readonly itemService: ItemDataService,
    private readonly enemyService: EnemyDataService,
  ) {}

  /**
   * Seed all game data from JSON files
   * Runs all seeds in parallel for performance
   */
  async seedAll(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('Starting game data seeding...');

    try {
      await Promise.all([
        this.seedClasses(),
        this.seedRaces(),
        this.seedAptitudes(),
        this.seedItems(),
        this.seedEnemies(),
      ]);

      const duration = Date.now() - startTime;
      this.logger.log(`Game data seeding completed in ${duration}ms`);
    } catch (error) {
      this.logger.error('Game data seeding failed', error);
      throw error;
    }
  }

  /**
   * Seed character classes from organized JSON files
   */
  private async seedClasses(): Promise<void> {
    try {
      const classes = [
        this.buildClassSeedData(guerrierStats, guerrierVoies),
        this.buildClassSeedData(rogueStats, rogueVoies),
        this.buildClassSeedData(mageStats, mageVoies),
      ];

      await Promise.all(classes.map(cls => this.classService.seed(cls)));
      this.logger.log(`Seeded ${classes.length} character classes`);
    } catch (error) {
      this.logger.error('Failed to seed classes', error);
      throw error;
    }
  }

  /**
   * Seed races from JSON
   */
  private async seedRaces(): Promise<void> {
    try {
      await this.raceService.seedFromJson(racesData);
      this.logger.log(`Seeded ${racesData.length} races`);
    } catch (error) {
      this.logger.error('Failed to seed races', error);
      throw error;
    }
  }

  /**
   * Seed aptitudes from JSON
   */
  private async seedAptitudes(): Promise<void> {
    try {
      await this.aptitudeService.seedFromJson(aptitudesData);
      this.logger.log(`Seeded ${aptitudesData.length} aptitudes`);
    } catch (error) {
      this.logger.error('Failed to seed aptitudes', error);
      throw error;
    }
  }

  /**
   * Seed items from multiple JSON sources
   */
  private async seedItems(): Promise<void> {
    try {
      // Combine all item sources
      const allItems = [
        ...starterPackItems.map(item => ({
          ...item,
          isStarter: true,
        })),
        ...weaponsDefinitions,
        ...itemsDefinitions,
        ...armorDefinitions,
      ];

      await this.itemService.seedFromJson(allItems);
      this.logger.log(`Seeded ${allItems.length} item definitions`);
    } catch (error) {
      this.logger.error('Failed to seed items', error);
      throw error;
    }
  }

  /**
   * Seed enemies from JSON
   */
  private async seedEnemies(): Promise<void> {
    try {
      await this.enemyService.seedFromJson(enemiesData);
      this.logger.log(`Seeded ${enemiesData.length} enemy definitions`);
    } catch (error) {
      this.logger.error('Failed to seed enemies', error);
      throw error;
    }
  }

  /**
   * Build class seed data from stats.json and voies.json files
   */
  private buildClassSeedData(
    stats: {
      name: string;
      displayName?: string;
      description?: string;
      hp_base: number;
      hp_gain?: number;
      pa: number;
      pm: number;
      main_stat?: string;
      proficiencies?: string[];
      startingAptitudes?: string[];
      color?: string;
      icon?: string;
    },
    voies: {
      voies: Record<string, {
        name: string;
        description?: string;
        ranks: Array<{ rank: number; aptitudeId: string; pointCost: number }>;
      }>;
    },
  ): {
    name: string;
    displayName?: string;
    description?: string;
    baseStats: { hp_base: number; hp_gain?: number; pa: number; pm: number };
    main_stat?: string;
    proficiencies?: string[];
    startingAptitudes?: string[];
    talentTrees: Record<string, { name: string; description?: string; ranks: Array<{ rank: number; aptitudeId: string; pointCost: number }> }>;
    color?: string;
    icon?: string;
  } {
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
      main_stat: stats.main_stat,
      proficiencies: stats.proficiencies,
      startingAptitudes: stats.startingAptitudes,
      talentTrees: voies.voies,
      color: stats.color,
      icon: stats.icon,
    };
  }
}
