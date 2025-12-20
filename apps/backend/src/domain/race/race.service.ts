import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Race } from "../../infra/mongo/race/index.js";
import type { RaceDocument, TraitEffectData } from "../../infra/mongo/race/index.js";

export interface RaceMetadata {
  id: string;
  name: string;
  bonuses: {
    vigor?: number;
    finesse?: number;
    mind?: number;
    survival?: number;
  };
  trait: string;
  traitEffect: TraitEffectData;
  descriptionForAi?: string;
  icon?: string;
  color?: string;
}

@Injectable()
export class RaceService {
  private readonly logger = new Logger(RaceService.name);

  constructor(
    @InjectModel(Race.name) private raceModel: Model<RaceDocument>,
  ) {}

  /**
   * Get all available races with metadata for UI
   */
  async getAllRaces(): Promise<RaceMetadata[]> {
    const races = await this.raceModel.find().exec();
    return races.map(race => ({
      id: race.raceId,
      name: race.name,
      bonuses: {
        vigor: race.bonuses?.vigor || 0,
        finesse: race.bonuses?.finesse || 0,
        mind: race.bonuses?.mind || 0,
        survival: race.bonuses?.survival || 0,
      },
      trait: race.trait,
      traitEffect: race.traitEffect,
      descriptionForAi: race.descriptionForAi,
      icon: race.icon,
      color: race.color,
    }));
  }

  /**
   * Get a race by its ID
   */
  async getRaceById(raceId: string): Promise<RaceMetadata> {
    const race = await this.raceModel.findOne({ raceId }).exec();
    if (!race) {
      throw new NotFoundException(`Race ${raceId} not found`);
    }
    return {
      id: race.raceId,
      name: race.name,
      bonuses: {
        vigor: race.bonuses?.vigor || 0,
        finesse: race.bonuses?.finesse || 0,
        mind: race.bonuses?.mind || 0,
        survival: race.bonuses?.survival || 0,
      },
      trait: race.trait,
      traitEffect: race.traitEffect,
      descriptionForAi: race.descriptionForAi,
      icon: race.icon,
      color: race.color,
    };
  }

  /**
   * Seed races from JSON data
   */
  async seedFromJson(races: Array<{
    id: string;
    name: string;
    bonuses: { vigor?: number; finesse?: number; mind?: number; survival?: number, '*'?: number};
    trait: string;
    traitEffect: TraitEffectData;
    descriptionForAi?: string;
    icon?: string;
    color?: string;
  }>): Promise<void> {
    const operations = races.map(race => ({
      updateOne: {
        filter: { raceId: race.id },
        update: {
          $set: {
            raceId: race.id,
            name: race.name,
            bonuses: race.bonuses,
            trait: race.trait,
            traitEffect: race.traitEffect,
            descriptionForAi: race.descriptionForAi,
            icon: race.icon,
            color: race.color,
          },
        },
        upsert: true,
      },
    }));

    await this.raceModel.bulkWrite(operations);
    this.logger.log(`Seeded ${races.length} races`);
  }

  /**
   * Upsert a single race
   */
  async upsert(raceData: {
    id: string;
    name: string;
    bonuses: { vigor?: number; finesse?: number; mind?: number; survival?: number };
    trait: string;
    traitEffect: TraitEffectData;
    descriptionForAi?: string;
    icon?: string;
    color?: string;
  }): Promise<RaceDocument> {
    return this.raceModel.findOneAndUpdate(
      { raceId: raceData.id },
      {
        $set: {
          raceId: raceData.id,
          name: raceData.name,
          bonuses: raceData.bonuses,
          trait: raceData.trait,
          traitEffect: raceData.traitEffect,
          descriptionForAi: raceData.descriptionForAi,
          icon: raceData.icon,
          color: raceData.color,
        },
      },
      { upsert: true, new: true },
    );
  }
}
