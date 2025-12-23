import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Race } from '../../domain/race/entities/Race.js';
import { IRaceRepository, RACE_REPOSITORY } from '../../domain/race/repositories/IRaceRepository.js';
import { TraitEffectType, TraitCondition } from '../../domain/race/value-objects/TraitEffect.js';

/**
 * Application service for Race data
 * 
 * @application game-data
 */
@Injectable()
export class RaceDataService {
  constructor(@Inject(RACE_REPOSITORY) private readonly raceRepository: IRaceRepository) {}

  /**
   * Find a race by ID
   */
  async findById(id: string): Promise<Race | null> {
    return this.raceRepository.findById(id);
  }

  /**
   * Get a race by ID or throw if not found
   */
  async getById(id: string): Promise<Race> {
    const race = await this.raceRepository.findById(id);
    if (!race) {
      throw new NotFoundException(`Race '${id}' not found`);
    }
    return race;
  }

  /**
   * Find all available races
   */
  async findAll(): Promise<Race[]> {
    return this.raceRepository.findAll();
  }

  /**
   * Seed a race definition
   */
  async seed(data: {
    id: string;
    name: string;
    bonuses: { vigor?: number; finesse?: number; mind?: number; survival?: number; '*'?: number };
    trait: string;
    traitEffect: { type: TraitEffectType; value: number; subType?: string; condition?: TraitCondition };
    descriptionForAi?: string;
    icon?: string;
    color?: string;
  }): Promise<void> {
    const race = Race.fromSeedData(data);
    await this.raceRepository.upsert(race);
  }

  /**
   * Seed multiple races from JSON data
   */
  async seedFromJson(data: Array<{
    id: string;
    name: string;
    bonuses: { vigor?: number; finesse?: number; mind?: number; survival?: number; '*'?: number };
    trait: string;
    traitEffect: { type: string; value: number; subType?: string; condition?: string };
    descriptionForAi?: string;
    icon?: string;
    color?: string;
  }>): Promise<void> {
    for (const item of data) {
      await this.seed({
        ...item,
        traitEffect: {
          type: item.traitEffect.type as TraitEffectType,
          value: item.traitEffect.value,
          subType: item.traitEffect.subType,
          condition: item.traitEffect.condition as TraitCondition,
        },
      });
    }
  }

  /**
   * Check if a race exists
   */
  async exists(id: string): Promise<boolean> {
    return this.raceRepository.exists(id);
  }
}
