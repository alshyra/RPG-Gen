import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ClassDefinitionService } from "../class-definition/class-definition.service.js";
import { ClassDefinition } from "../../infra/mongo/index.js";

/**
 * Service for the new simplified Talent Tree system.
 * Replaces the old D&D-based class progression.
 */
@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    private readonly classDefService: ClassDefinitionService,
  ) {}

  /**
   * Get all available classes
   */
  async getAllClasses(): Promise<ClassDefinition[]> {
    return this.classDefService.findAll();
  }

  /**
   * Get a class by name
   */
  async getClassByName(name: string): Promise<ClassDefinition> {
    return this.classDefService.findByNameOrThrow(name);
  }

  /**
   * Get talent trees (voies) for a class
   */
  async getTalentTrees(className: string) {
    const classData = await this.classDefService.findByNameOrThrow(className);
    
    if (!classData.talentTrees) {
      return [];
    }

    // Convert Map to array of voies
    const voies: Array<{
      id: string;
      name: string;
      ranks: Array<{
        rank: number;
        aptitudeId: string;
        pointCost: number;
      }>;
    }> = [];

    // Handle both Map and plain object (from Mongoose)
    const trees = classData.talentTrees;
    if (trees instanceof Map) {
      trees.forEach((tree, key) => {
        voies.push({
          id: key,
          name: tree.name,
          ranks: tree.ranks || [],
        });
      });
    } else if (typeof trees === "object") {
      Object.entries(trees).forEach(([key, tree]) => {
        voies.push({
          id: key,
          name: (tree as { name: string }).name,
          ranks: (tree as { ranks: Array<{ rank: number; aptitudeId: string; pointCost: number }> }).ranks || [],
        });
      });
    }

    return voies;
  }

  /**
   * Get starting aptitudes for a class
   */
  async getStartingAptitudes(className: string): Promise<string[]> {
    const classData = await this.classDefService.findByNameOrThrow(className);
    return classData.startingAptitudes || [];
  }

  /**
   * Get base stats for a class
   */
  async getBaseStats(className: string): Promise<{
    hp_base: number;
    pa: number;
    pm: number;
  }> {
    const classData = await this.classDefService.findByNameOrThrow(className);
    return classData.baseStats;
  }
}
