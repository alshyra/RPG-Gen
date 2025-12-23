import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { VoieProgressDto } from "../../character/api/dto/response/VoieProgressDto.js";
import { ArchetypeDocument } from "../infrastructure/persistence/mongo/schemas/ArchetypeDocument.js";
import { TalentTree } from "../domain/value-objects/TalentTree.js";
import { TalentRank } from "../domain/value-objects/TalentRank.js";

@Injectable()
export class TalentTreeService {
  private readonly logger = new Logger(TalentTreeService.name);

  constructor(
    @InjectModel(ArchetypeDocument.name) private classDefinitionModel: Model<ArchetypeDocument>,
  ) {}

  /**
   * Get all talent trees (voies) for a class
   */
  async getVoiesByClass(className: string): Promise<TalentTree[]> {
    const classDef = await this.classDefinitionModel.findOne({ name: className }).exec();
    if (!classDef) {
      throw new NotFoundException(`Class ${className} not found`);
    }

    // talentTrees is a Record<string, TalentTree>
    const voies = Object.values(classDef.talentTrees || {});
    return voies;
  }

  /**
   * Get a specific voie (talent tree) by name for a class
   */
  async getVoieByName(className: string, voieName: string): Promise<TalentTree | null> {
    const classDef = await this.classDefinitionModel.findOne({ name: className }).exec();
    if (!classDef) {
      throw new NotFoundException(`Class ${className} not found`);
    }

    const voie = classDef.talentTrees[voieName];
    return voie || null;
  }

  /**
   * Get a specific rank in a voie
   */
  async getRankInVoie(className: string, voieName: string, rankNumber: number): Promise<TalentRank | null> {
    const voie = await this.getVoieByName(className, voieName);
    if (!voie) {
      return null;
    }

    return voie.ranks?.find(r => r.rank === rankNumber) || null;
  }

  /**
   * Calculate total talent points required to reach a rank
   */
  calculateTalentPointsForRank(voie: TalentTree, targetRank: number): number {
    if (targetRank < 1 || targetRank > 5) {
      throw new Error("Rank must be between 1 and 5");
    }

    let totalPoints = 0;
    for (let i = 1; i <= targetRank; i++) {
      const rank = voie.ranks?.find(r => r.rank === i);
      if (rank) {
        totalPoints += rank.pointCost || 1;
      }
    }
    return totalPoints;
  }

  /**
   * Get all voie data with metadata
   */
  async getVoiesWithMetadata(className: string): Promise<VoieProgressDto[]> {
    const voies = await this.getVoiesByClass(className);
    return voies.map((voie, index) => ({
      voieId: `voie_${index}`, // Simple ID generation - can be improved
      voieName: voie.name,
      className,
      currentRank: 0, // Default unstarted
      requiredTalentPoints: this.calculateTalentPointsForRank(voie, 1),
      unlockedAptitudes: [],
      ranks: (voie.ranks || []).map(rank => ({
        rank: rank.rank,
        aptitudeId: rank.aptitudeId,
        pointCost: rank.pointCost,
      })),
    }));
  }

  /**
   * Get total talent points required for all 3 voies at a specific rank
   */
  calculateTotalPointsForAllVoies(className: string, targetRank: number): Promise<number> {
    return this.getVoiesByClass(className).then(voies => {
      return voies.reduce((total, voie) => {
        return total + this.calculateTalentPointsForRank(voie, targetRank);
      }, 0);
    });
  }

  /**
   * Validate that a rank can be unlocked (prerequisite checks)
   */
  async validateRankUnlock(
    className: string,
    voieName: string,
    targetRank: number,
    currentRank: number,
  ): Promise<boolean> {
    // Can only unlock consecutive ranks
    if (targetRank !== currentRank + 1) {
      this.logger.warn(
        `Invalid rank progression: current ${currentRank}, target ${targetRank} for ${className}/${voieName}`,
      );
      return false;
    }

    if (targetRank < 1 || targetRank > 5) {
      return false;
    }

    return true;
  }
}
