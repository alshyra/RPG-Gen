import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { EnemyDefinition } from '../../domain/enemy/entities/EnemyDefinition.js';
import { IEnemyRepository, ENEMY_REPOSITORY } from '../../domain/enemy/repositories/IEnemyRepository.js';

/**
 * Application service for EnemyDefinition data
 * NOT exposed via API (backend-only for combat)
 * 
 * @application game-data
 */
@Injectable()
export class EnemyDataService {
  private readonly logger = new Logger(EnemyDataService.name);

  constructor(@Inject(ENEMY_REPOSITORY) private readonly enemyRepository: IEnemyRepository) {}

  /**
   * Find an enemy by ID
   */
  async findById(id: string): Promise<EnemyDefinition | null> {
    return this.enemyRepository.findById(id);
  }

  /**
   * Find an enemy by name
   */
  async findByName(name: string): Promise<EnemyDefinition | null> {
    return this.enemyRepository.findByName(name);
  }

  /**
   * Get an enemy by ID or throw if not found
   */
  async getById(id: string): Promise<EnemyDefinition> {
    const enemy = await this.enemyRepository.findById(id);
    if (!enemy) {
      throw new NotFoundException(`Enemy '${id}' not found`);
    }
    return enemy;
  }

  /**
   * Find multiple enemies by IDs
   */
  async findByIds(ids: string[]): Promise<EnemyDefinition[]> {
    return this.enemyRepository.findByIds(ids);
  }

  /**
   * Find all enemies
   */
  async findAll(): Promise<EnemyDefinition[]> {
    return this.enemyRepository.findAll();
  }

  /**
   * Find enemies suitable for a given player level
   */
  async findByLevelRange(minLevel: number, maxLevel: number): Promise<EnemyDefinition[]> {
    return this.enemyRepository.findByLevelRange(minLevel, maxLevel);
  }

  /**
   * Get random enemies for combat
   */
  async getRandomEnemies(count: number, level: number): Promise<EnemyDefinition[]> {
    const minLevel = Math.max(1, level - 2);
    const maxLevel = level + 2;
    const candidates = await this.findByLevelRange(minLevel, maxLevel);
    
    if (candidates.length === 0) {
      return this.findAll().then(all => all.slice(0, count));
    }

    // Shuffle and pick
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Seed an enemy definition
   */
  async seed(data: {
    name: string;
    hp: number;
    attack_bonus?: number;
    damage_dice?: string;
    damage_bonus?: number;
    aptitudes?: string[];
    level?: number;
  }): Promise<void> {
    const enemy = EnemyDefinition.fromSeedData(data);
    await this.enemyRepository.upsert(enemy);
  }

  /**
   * Seed multiple enemies from JSON data
   */
  async seedFromJson(data: Array<{
    name: string;
    hp: number;
    attack_bonus?: number;
    damage_dice?: string;
    damage_bonus?: number;
    aptitudes?: string[];
    level?: number;
  }>): Promise<void> {
    const enemies = data.map(item => EnemyDefinition.fromSeedData(item));
    await this.enemyRepository.bulkUpsert(enemies);
    this.logger.log(`Seeded ${enemies.length} enemies`);
  }

  /**
   * Check if an enemy exists
   */
  async exists(id: string): Promise<boolean> {
    return this.enemyRepository.exists(id);
  }
}
