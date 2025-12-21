import { Injectable, Logger } from "@nestjs/common";
import { ClassDefinitionService } from "../class-definition/class-definition.service.js";
import { ClassDefinition } from "../../infra/mongo/index.js";
import { ClassDefinitionResponseDto, TalentTreeDto } from "./dto/index.js";

// Type guard for tree objects
const isTalentTree = (value: unknown): value is { name: string; ranks?: Array<{ rank: number; aptitudeId: string; pointCost: number }> } => {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).name === "string";
};

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
   * Convert ClassDefinition model to ClassDefinitionResponseDto
   */
  private toClassDefinitionDto(classDef: ClassDefinition): ClassDefinitionResponseDto {
    return {
      name: classDef.name,
      baseStats: classDef.baseStats,
      startingAptitudes: classDef.startingAptitudes,
    };
  }

  /**
   * Convert ClassDefinition to TalentTreeDto array
   */
  private toTalentTreeDtos(classDef: ClassDefinition): TalentTreeDto[] {
    if (!classDef.talentTrees) {
      return [];
    }

    const voies: TalentTreeDto[] = [];
    const trees = classDef.talentTrees;
    
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
        if (isTalentTree(tree)) {
          voies.push({
            id: key,
            name: tree.name,
            ranks: tree.ranks || [],
          });
        }
      });
    }

    return voies;
  }

  /**
   * Get all available classes
   */
  async getAllClasses(): Promise<ClassDefinitionResponseDto[]> {
    const classes = await this.classDefService.findAll();
    return classes.map(c => this.toClassDefinitionDto(c));
  }

  /**
   * Get a class by name
   */
  async getClassByName(name: string): Promise<ClassDefinitionResponseDto> {
    const classDef = await this.classDefService.findByNameOrThrow(name);
    return this.toClassDefinitionDto(classDef);
  }

  /**
   * Get talent trees (voies) for a class
   */
  async getTalentTrees(className: string): Promise<TalentTreeDto[]> {
    const classData = await this.classDefService.findByNameOrThrow(className);
    return this.toTalentTreeDtos(classData);
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
