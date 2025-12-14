import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SpellDefinition,
  SpellDefinitionDocument,
} from '../../infra/mongo/spell/SpellDefinition.js';
import { spellsArraySchema } from './validators.js';

@Injectable()
export class SpellDefinitionService {
  private readonly logger = new Logger(SpellDefinitionService.name);

  constructor(@InjectModel(SpellDefinition.name) private model: Model<SpellDefinitionDocument>) {}

  async findAll(): Promise<SpellDefinition[]> {
    return this.model
      .find()
      .sort({
        level: 1,
        name: 1,
      })
      .exec();
  }

  async findByName(name: string): Promise<SpellDefinition | null> {
    return this.model.findOne({ name }).exec();
  }

  async findByDefinitionId(definitionId: string): Promise<SpellDefinition> {
    const result = await this.model.findOne({ definitionId }).exec();
    if (!result) throw new NotFoundException(`SpellDefinition not found: ${definitionId}`);
    return result;
  }

  async findByLevel(level: number): Promise<SpellDefinition[]> {
    return this.model.find({ level }).sort({ name: 1 }).exec();
  }

  async upsert(def: Partial<SpellDefinition>) {
    // Require a definitionId so we can reliably upsert seeded definitions
    if (!def.definitionId) throw new Error('definitionId required');
    const existing = await this.model.findOne({ definitionId: def.definitionId }).exec();
    if (existing) {
      Object.assign(existing, def);
      return existing.save();
    }
    const created = new this.model(def);
    return created.save();
  }

  async insertSpell(spell) {
    try {
      // Prefer matching by definitionId when available, otherwise fallback to name
      let existing = spell.definitionId
        ? await this.model.findOne({ definitionId: spell.definitionId }).exec()
        : null;

      if (!existing && spell.name) {
        existing = await this.model.findOne({ name: spell.name }).exec();
      }

      if (existing) return 'skipped';

      // Ensure we have a definitionId before upsert
      if (!spell.definitionId && spell.name) {
        // fallback slug: simple ASCII-safe lowercase hyphenated
        const fallback = `spell-${spell.level ?? 'x'}-${String(spell.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}`;
        spell.definitionId = fallback;
      }

      await this.upsert(spell);
      return 'imported';
    } catch (error) {
      this.logger.warn(`Failed to seed spell ${spell.name}: ${(error as Error).message}`);
      return 'error';
    }
  }

  async seedFromJson(rawSpells: unknown): Promise<void> {
    const incoming = Array.isArray(rawSpells) ? rawSpells : [];
    this.logger.log(`Seeding ${incoming.length} raw spell definitions...`);

    try {
      const parsed = spellsArraySchema.parse(incoming);
      // parsed is an array of coerced/validated spell objects
      const validated: Partial<SpellDefinition>[] = parsed.map(ok => ({
        definitionId: ok.definitionId,
        name: ok.name,
        level: ok.level,
        school: ok.school,
        castingTime: ok.castingTime,
        range: ok.range,
        components: ok.components,
        duration: ok.duration,
        ritual: ok.ritual,
        description: ok.description,
        meta: ok.meta,
      }));

      this.logger.log(`Seeding ${validated.length} validated spell definitions...`);

      const results = await Promise.all(validated.map(this.insertSpell.bind(this)));

      const imported = results.filter(r => r === 'imported').length;
      const skipped = results.filter(r => r === 'skipped').length;

      this.logger.log(`Spell definitions seeded: ${imported} imported, ${skipped} skipped`);
      return;
    } catch (err) {
      // zod throws on parse failures; surface a readable error so callers/CI will see the problem
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Spell seed validation failed: ${message}`);
      throw new Error(`Spell seed validation failed: ${message}`);
    }
  }
}
