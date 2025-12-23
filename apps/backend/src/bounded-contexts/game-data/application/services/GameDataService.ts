import { Injectable, NotFoundException } from '@nestjs/common';
import { CharacterClass } from '../../domain/class/entities/CharacterClass.js';
import { Race } from '../../domain/race/entities/Race.js';
import { Aptitude } from '../../domain/aptitude/entities/Aptitude.js';
import { ItemDefinition } from '../../domain/item/entities/ItemDefinition.js';
import { EnemyDefinition } from '../../domain/enemy/entities/EnemyDefinition.js';
import { ClassDataService } from './ClassDataService.js';
import { RaceDataService } from './RaceDataService.js';
import { AptitudeDataService } from './AptitudeDataService.js';
import { ItemDataService } from './ItemDataService.js';
import { EnemyDataService } from './EnemyDataService.js';

/**
 * Facade service for accessing all game data
 * 
 * Simplifies injection in other BCs by providing a single entry point
 * to all game data (classes, races, aptitudes, items, enemies).
 * 
 * @application game-data
 */
@Injectable()
export class GameDataService {
  constructor(
    private readonly classService: ClassDataService,
    private readonly raceService: RaceDataService,
    private readonly aptitudeService: AptitudeDataService,
    private readonly itemService: ItemDataService,
    private readonly enemyService: EnemyDataService,
  ) {}

  // ============================================
  // CLASSES
  // ============================================

  /**
   * Get a class by name or throw if not found
   */
  async getClass(name: string): Promise<CharacterClass> {
    const cls = await this.classService.findByName(name);
    if (!cls) {
      throw new NotFoundException(`Class '${name}' not found`);
    }
    return cls;
  }

  /**
   * Find a class by name (may return null)
   */
  async findClass(name: string): Promise<CharacterClass | null> {
    return this.classService.findByName(name);
  }

  /**
   * Get all available classes
   */
  async getAllClasses(): Promise<CharacterClass[]> {
    return this.classService.findAll();
  }

  // ============================================
  // RACES
  // ============================================

  /**
   * Get a race by ID or throw if not found
   */
  async getRace(raceId: string): Promise<Race> {
    const race = await this.raceService.findById(raceId);
    if (!race) {
      throw new NotFoundException(`Race '${raceId}' not found`);
    }
    return race;
  }

  /**
   * Find a race by ID (may return null)
   */
  async findRace(raceId: string): Promise<Race | null> {
    return this.raceService.findById(raceId);
  }

  /**
   * Get all available races
   */
  async getAllRaces(): Promise<Race[]> {
    return this.raceService.findAll();
  }

  // ============================================
  // APTITUDES
  // ============================================

  /**
   * Get an aptitude by ID or throw if not found
   */
  async getAptitude(aptitudeId: string): Promise<Aptitude> {
    const aptitude = await this.aptitudeService.findById(aptitudeId);
    if (!aptitude) {
      throw new NotFoundException(`Aptitude '${aptitudeId}' not found`);
    }
    return aptitude;
  }

  /**
   * Find an aptitude by ID (may return null)
   */
  async findAptitude(aptitudeId: string): Promise<Aptitude | null> {
    return this.aptitudeService.findById(aptitudeId);
  }

  /**
   * Get multiple aptitudes by IDs
   */
  async getAptitudesByIds(aptitudeIds: string[]): Promise<Aptitude[]> {
    return this.aptitudeService.findByIds(aptitudeIds);
  }

  /**
   * Get all aptitudes
   */
  async getAllAptitudes(): Promise<Aptitude[]> {
    return this.aptitudeService.findAll();
  }

  /**
   * Calculate scaled power for an aptitude
   */
  calculateScaledPower(basePower: number, level: number): number {
    return this.aptitudeService.calculateScaledPower(basePower, level);
  }

  // ============================================
  // ITEMS
  // ============================================

  /**
   * Get an item by definition ID or throw if not found
   */
  async getItem(definitionId: string): Promise<ItemDefinition> {
    const item = await this.itemService.findById(definitionId);
    if (!item) {
      throw new NotFoundException(`Item '${definitionId}' not found`);
    }
    return item;
  }

  /**
   * Find an item by definition ID (may return null)
   */
  async findItem(definitionId: string): Promise<ItemDefinition | null> {
    return this.itemService.findById(definitionId);
  }

  /**
   * Get all items
   */
  async getAllItems(): Promise<ItemDefinition[]> {
    return this.itemService.findAll();
  }

  /**
   * Get all weapons
   */
  async getWeapons(): Promise<ItemDefinition[]> {
    return this.itemService.findByType('weapon');
  }

  /**
   * Get all armor
   */
  async getArmor(): Promise<ItemDefinition[]> {
    return this.itemService.findByType('armor');
  }

  /**
   * Get starter items
   */
  async getStarterItems(): Promise<ItemDefinition[]> {
    return this.itemService.findStarters();
  }

  // ============================================
  // ENEMIES (Backend only - not exposed via API)
  // ============================================

  /**
   * Get an enemy by ID or throw if not found
   */
  async getEnemy(enemyId: string): Promise<EnemyDefinition> {
    const enemy = await this.enemyService.findById(enemyId);
    if (!enemy) {
      throw new NotFoundException(`Enemy '${enemyId}' not found`);
    }
    return enemy;
  }

  /**
   * Find an enemy by ID (may return null)
   */
  async findEnemy(enemyId: string): Promise<EnemyDefinition | null> {
    return this.enemyService.findById(enemyId);
  }

  /**
   * Find an enemy by name
   */
  async findEnemyByName(name: string): Promise<EnemyDefinition | null> {
    return this.enemyService.findByName(name);
  }

  /**
   * Get multiple enemies by IDs
   */
  async getEnemiesByIds(enemyIds: string[]): Promise<EnemyDefinition[]> {
    return this.enemyService.findByIds(enemyIds);
  }

  /**
   * Get random enemies for combat
   */
  async getRandomEnemies(count: number, level: number): Promise<EnemyDefinition[]> {
    return this.enemyService.getRandomEnemies(count, level);
  }
}
