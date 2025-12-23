import { Race } from '../../../domain/race/entities/Race.js';
import { RacialBonuses } from '../../../domain/race/value-objects/RacialBonuses.js';
import { TraitEffect, TraitEffectType, TraitCondition } from '../../../domain/race/value-objects/TraitEffect.js';
import { RaceDocument } from '../mongo/schemas/RaceDocument.js';

/**
 * Mapper for Race entity ↔ RaceDocument
 * 
 * @infrastructure game-data
 */
export class RaceMapper {
  /**
   * Map MongoDB document to domain entity
   */
  static toDomain(doc: RaceDocument): Race {
    const bonuses = new RacialBonuses({
      vigor: doc.bonuses.vigor,
      finesse: doc.bonuses.finesse,
      mind: doc.bonuses.mind,
      survival: doc.bonuses.survival,
    });

    const traitEffect = new TraitEffect({
      type: doc.traitEffect.type as TraitEffectType,
      value: doc.traitEffect.value,
      subType: doc.traitEffect.subType,
      condition: doc.traitEffect.condition as TraitCondition,
    });

    return new Race({
      id: doc.raceId,
      name: doc.name,
      bonuses,
      trait: doc.trait,
      traitEffect,
      descriptionForAi: doc.descriptionForAi,
      icon: doc.icon,
      color: doc.color,
    });
  }

  /**
   * Map domain entity to MongoDB document data
   */
  static toPersistence(entity: Race): Partial<RaceDocument> {
    return {
      raceId: entity.id,
      name: entity.name,
      bonuses: {
        vigor: entity.bonuses.vigor,
        finesse: entity.bonuses.finesse,
        mind: entity.bonuses.mind,
        survival: entity.bonuses.survival,
      },
      trait: entity.trait,
      traitEffect: {
        type: entity.traitEffect.type,
        value: entity.traitEffect.value,
        subType: entity.traitEffect.subType,
        condition: entity.traitEffect.condition,
      },
      descriptionForAi: entity.descriptionForAi,
      icon: entity.icon,
      color: entity.color,
    };
  }
}
