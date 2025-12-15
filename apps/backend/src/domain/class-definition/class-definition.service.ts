import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  ClassDefinition,
  ClassDefinitionDocument,
} from "../../infra/mongo/class/ClassDefinition.js";

@Injectable()
export class ClassDefinitionService {
  private readonly logger = new Logger(ClassDefinitionService.name);

  constructor(@InjectModel(ClassDefinition.name) private model: Model<ClassDefinitionDocument>) {}

  async findAll(): Promise<ClassDefinition[]> {
    return this.model.find().sort({ name: 1 }).exec();
  }

  async findByName(name: string): Promise<ClassDefinition | null> {
    return this.model.findOne({ name }).exec();
  }

  async findByNameOrThrow(name: string): Promise<ClassDefinition> {
    const result = await this.findByName(name);
    if (!result) throw new NotFoundException(`ClassDefinition not found: ${name}`);
    return result;
  }

  async upsert(def: Partial<ClassDefinition>) {
    // Require a name so we can reliably upsert seeded definitions
    if (!def.name) throw new Error("name required");
    const existing = await this.model.findOne({ name: def.name }).exec();
    if (existing) {
      Object.assign(existing, def);
      return existing.save();
    }
    const created = new this.model(def);
    return created.save();
  }

  async seedFromJson(rawClassData: unknown): Promise<void> {
    if (!Array.isArray(rawClassData)) {
      this.logger.warn("Class seed data is not an array, skipping");
      return;
    }

    this.logger.log(`Seeding ${rawClassData.length} class definitions...`);

    try {
      const results = await Promise.all(
        rawClassData.map(async classData => {
          try {
            const validated = {
              name: classData.className,
              hitDie: classData.hitDie,
              primarySpellAbility: classData.primarySpellAbility || "",
              description: classData.description || "",
              schemaVersion: classData.schemaVersion || 1,
              levels: classData.levels || [],
              allowedSpellsByLevel: classData.allowedSpellsByLevel || {},
              combatOptionsByLevel: classData.combatOptionsByLevel || {},
            };

            await this.upsert(validated);
            return { status: "imported", name: classData.className };
          } catch (err) {
            this.logger.warn(
              `Failed to seed class ${classData.className}: ${(err as Error).message}`,
            );
            return { status: "error", name: classData.className };
          }
        }),
      );

      const imported = results.filter(r => r.status === "imported").length;
      const errors = results.filter(r => r.status === "error").length;

      this.logger.log(`Class definitions seeded: ${imported} imported, ${errors} errors`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Class seed failed: ${message}`);
      throw new Error(`Class seed failed: ${message}`);
    }
  }
}
