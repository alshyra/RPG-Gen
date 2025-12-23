import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CharacterClass } from '../../domain/class/entities/CharacterClass.js';
import { IClassRepository, CLASS_REPOSITORY } from '../../domain/class/repositories/IClassRepository.js';

/**
 * Application service for CharacterClass data
 * 
 * @application game-data
 */
@Injectable()
export class ClassDataService {
  constructor(@Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository) {}

  /**
   * Find a class by name
   */
  async findByName(name: string): Promise<CharacterClass | null> {
    return this.classRepository.findByName(name);
  }

  /**
   * Get a class by name or throw if not found
   */
  async getByName(name: string): Promise<CharacterClass> {
    const characterClass = await this.classRepository.findByName(name);
    if (!characterClass) {
      throw new NotFoundException(`Class '${name}' not found`);
    }
    return characterClass;
  }

  /**
   * Find all available classes
   */
  async findAll(): Promise<CharacterClass[]> {
    return this.classRepository.findAll();
  }

  /**
   * Seed a class definition
   */
  async seed(data: {
    name: string;
    displayName?: string;
    description?: string;
    baseStats: { hp_base: number; hp_gain?: number; pa: number; pm: number };
    main_stat?: string;
    proficiencies?: string[];
    startingAptitudes?: string[];
    talentTrees?: Record<string, { name: string; description?: string; ranks: Array<{ rank: number; aptitudeId: string; pointCost: number }> }>;
    color?: string;
    icon?: string;
  }): Promise<void> {
    const characterClass = CharacterClass.fromSeedData(data);
    await this.classRepository.upsert(characterClass);
  }

  /**
   * Check if a class exists
   */
  async exists(name: string): Promise<boolean> {
    return this.classRepository.exists(name);
  }
}
