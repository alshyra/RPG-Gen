import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Aptitude, AptitudeDocument } from "../../infra/mongo/aptitude/Aptitude.js";

@Injectable()
export class AptitudeService {
  private readonly logger = new Logger(AptitudeService.name);

  constructor(
    @InjectModel(Aptitude.name) private aptitudeModel: Model<AptitudeDocument>,
  ) {}

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
    basePower?: number;
    scaling?: string | null;
    descriptionForAi: string;
    // Additional optional fields
    area?: string;
    effectType?: string;
    moveType?: string;
    status?: string;
    ignoreTackle?: boolean;
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
            basePower: apt.basePower || 0,
            scaling: apt.scaling ? {
              attribute: apt.scaling,
              scalingDivisor: 5,
            } : undefined,
            // Additional tactical fields
            area: apt.area,
            effectType: apt.effectType,
            moveType: apt.moveType,
            status: apt.status,
            ignoreTackle: apt.ignoreTackle,
          },
        },
        upsert: true,
      },
    }));

    await this.aptitudeModel.bulkWrite(operations);
    this.logger.log(`Seeded ${aptitudes.length} aptitudes`);
  }
}
