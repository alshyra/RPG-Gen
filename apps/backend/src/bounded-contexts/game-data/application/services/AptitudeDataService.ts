import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { Aptitude, TargetType, ScalingStat, EffectType, MoveType, AreaShape, StatusEffect } from '../../domain/aptitude/entities/Aptitude.js';
import { IAptitudeRepository, APTITUDE_REPOSITORY } from '../../domain/aptitude/repositories/IAptitudeRepository.js';

/**
 * Application service for Aptitude data
 * 
 * @application game-data
 */
@Injectable()
export class AptitudeDataService {
  private readonly logger = new Logger(AptitudeDataService.name);

  constructor(@Inject(APTITUDE_REPOSITORY) private readonly aptitudeRepository: IAptitudeRepository) {}

  /**
   * Find an aptitude by ID
   */
  async findById(id: string): Promise<Aptitude | null> {
    return this.aptitudeRepository.findById(id);
  }

  /**
   * Get an aptitude by ID or throw if not found
   */
  async getById(id: string): Promise<Aptitude> {
    const aptitude = await this.aptitudeRepository.findById(id);
    if (!aptitude) {
      throw new NotFoundException(`Aptitude '${id}' not found`);
    }
    return aptitude;
  }

  /**
   * Find multiple aptitudes by IDs
   */
  async findByIds(ids: string[]): Promise<Aptitude[]> {
    return this.aptitudeRepository.findByIds(ids);
  }

  /**
   * Find all aptitudes
   */
  async findAll(): Promise<Aptitude[]> {
    return this.aptitudeRepository.findAll();
  }

  /**
   * Find aptitudes by effect type
   */
  async findByEffectType(effectType: string): Promise<Aptitude[]> {
    return this.aptitudeRepository.findByEffectType(effectType);
  }

  /**
   * Calculate scaled power based on character level using proficiency paliers
   * Paliers: 1-3 (+3), 4-6 (+5), 7-9 (+7), 10+ (+10)
   */
  calculateScaledPower(basePower: number, level: number): number {
    let proficiencyBonus: number;

    if (level >= 10) {
      proficiencyBonus = 10;
    } else if (level >= 7) {
      proficiencyBonus = 7;
    } else if (level >= 4) {
      proficiencyBonus = 5;
    } else {
      proficiencyBonus = 3; // levels 1-3
    }

    return basePower + proficiencyBonus;
  }

  /**
   * Seed an aptitude definition
   */
  async seed(data: {
    id: string;
    name: string;
    paCost?: number;
    cooldown?: number;
    targetType?: TargetType;
    range?: number;
    basePower?: number;
    scaling?: ScalingStat;
    effectType?: EffectType;
    moveType?: MoveType;
    area?: AreaShape;
    status?: StatusEffect;
    descriptionForAi?: string;
  }): Promise<void> {
    const aptitude = Aptitude.fromSeedData(data);
    await this.aptitudeRepository.upsert(aptitude);
  }

  /**
   * Seed multiple aptitudes from JSON data
   */
  async seedFromJson(data: Array<{
    id: string;
    name: string;
    paCost?: number;
    cooldown?: number;
    targetType?: string;
    range?: number;
    basePower?: number;
    scaling?: string;
    effectType?: string;
    moveType?: string;
    area?: string;
    status?: string;
    descriptionForAi?: string;
  }>): Promise<void> {
    const aptitudes = data.map(item => Aptitude.fromSeedData({
      ...item,
      targetType: item.targetType as TargetType,
      scaling: item.scaling as ScalingStat,
      effectType: item.effectType as EffectType,
      moveType: item.moveType as MoveType,
      area: item.area as AreaShape,
      status: item.status as StatusEffect,
    }));
    
    await this.aptitudeRepository.bulkUpsert(aptitudes);
    this.logger.log(`Seeded ${aptitudes.length} aptitudes`);
  }

  /**
   * Check if an aptitude exists
   */
  async exists(id: string): Promise<boolean> {
    return this.aptitudeRepository.exists(id);
  }
}
