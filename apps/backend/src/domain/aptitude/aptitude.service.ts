import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Aptitude, AptitudeDocument } from "../../infra/mongo/aptitude/Aptitude.js";
import { AptitudeResponseDto } from "../../bounded-contexts/character/api/dto/response/AptitudeResponseDto.js";

@Injectable()
export class AptitudeService {
  private readonly logger = new Logger(AptitudeService.name);

  constructor(
    @InjectModel(Aptitude.name) private aptitudeModel: Model<AptitudeDocument>,
  ) {}

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
   * Find all aptitudes
   */
  async findAll(): Promise<Aptitude[]> {
    return this.aptitudeModel.find().exec();
  }

  /**
   * Find aptitude by ID
   */
  async findById(aptitudeId: string): Promise<Aptitude | null> {
    return this.aptitudeModel.findOne({ aptitudeId }).exec();
  }

  /**
   * Find multiple aptitudes by IDs
   */
  async findByIds(aptitudeIds: string[]): Promise<Aptitude[]> {
    return this.aptitudeModel.find({ aptitudeId: { $in: aptitudeIds } }).exec();
  }

  /**
   * Get aptitude or throw if not found
   */
  async getById(aptitudeId: string): Promise<Aptitude> {
    const aptitude = await this.findById(aptitudeId);
    if (!aptitude) {
      throw new NotFoundException(`Aptitude ${aptitudeId} not found`);
    }
    return aptitude;
  }

  /**
   * Upsert an aptitude (create or update)
   */
  async upsert(data: Partial<Aptitude> & { aptitudeId: string }): Promise<Aptitude> {
    const result = await this.aptitudeModel.findOneAndUpdate(
      { aptitudeId: data.aptitudeId },
      { $set: data },
      { upsert: true, new: true },
    );
    return result;
  }

  /**
   * Seed aptitudes from JSON data
   */
  async seedFromJson(aptitudes: Array<{
    id: string;
    name: string;
    paCost: number;
    cooldown: number;
    targetType: string;
    range: number;
    basePower: number;
    scaling: string | null;
    descriptionForAi: string;
  }>): Promise<void> {
    const operations = aptitudes.map(apt => ({
      updateOne: {
        filter: { aptitudeId: apt.id },
        update: {
          $set: {
            aptitudeId: apt.id,
            name: apt.name,
            description: apt.descriptionForAi,
            descriptionForAi: apt.descriptionForAi,
            paCost: apt.paCost,
            cooldown: apt.cooldown,
            targetType: apt.targetType,
            range: apt.range,
            basePower: apt.basePower,
            scaling: apt.scaling ? {
              attribute: apt.scaling,
              scalingDivisor: 5,
            } : undefined,
          },
        },
        upsert: true,
      },
    }));

    await this.aptitudeModel.bulkWrite(operations);
    this.logger.log(`Seeded ${aptitudes.length} aptitudes`);
  }

  /**
   * Convert Aptitude entity to response DTO
   * The DTO constructor handles validation of required fields
   */
  toResponseDto(aptitude: Partial<Aptitude>): AptitudeResponseDto {
    return new AptitudeResponseDto({
      aptitudeId: aptitude.aptitudeId,
      name: aptitude.name,
      description: aptitude.description,
      descriptionForAi: aptitude.descriptionForAi,
      paCost: aptitude.paCost,
      pmCost: aptitude.pmCost,
      cooldown: aptitude.cooldown,
      targetType: aptitude.targetType,
      range: aptitude.range,
      areaOfEffect: aptitude.areaOfEffect,
      category: aptitude.category,
      basePower: aptitude.basePower,
      scaling: aptitude.scaling,
      appliesStatus: aptitude.appliesStatus,
      statusDuration: aptitude.statusDuration,
      classRestriction: aptitude.classRestriction,
      voieId: aptitude.voieId,
      rankRequired: aptitude.rankRequired,
      isStarting: aptitude.isStarting,
    });
  }
}
