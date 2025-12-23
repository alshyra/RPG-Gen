import { Aptitude, TargetType, ScalingStat, EffectType, MoveType, AreaShape, StatusEffect } from '../../../domain/aptitude/entities/Aptitude.js';
import { AptitudeDocument } from '../mongo/schemas/AptitudeDocument.js';

/**
 * Mapper for Aptitude entity ↔ AptitudeDocument
 * 
 * @infrastructure game-data
 */
export class AptitudeMapper {
  /**
   * Map MongoDB document to domain entity
   */
  static toDomain(doc: AptitudeDocument): Aptitude {
    return new Aptitude({
      id: doc.aptitudeId,
      name: doc.name,
      paCost: doc.paCost,
      cooldown: doc.cooldown,
      targetType: doc.targetType as TargetType,
      range: doc.range,
      basePower: doc.basePower,
      scaling: doc.scaling as ScalingStat,
      effectType: doc.effectType as EffectType,
      moveType: doc.moveType as MoveType | undefined,
      area: doc.area as AreaShape | undefined,
      status: doc.status as StatusEffect | undefined,
      descriptionForAi: doc.descriptionForAi,
    });
  }

  /**
   * Map domain entity to MongoDB document data
   */
  static toPersistence(entity: Aptitude): Partial<AptitudeDocument> {
    return {
      aptitudeId: entity.id,
      name: entity.name,
      paCost: entity.paCost,
      cooldown: entity.cooldown,
      targetType: entity.targetType,
      range: entity.range,
      basePower: entity.basePower,
      scaling: entity.scaling,
      effectType: entity.effectType,
      moveType: entity.moveType,
      area: entity.area,
      status: entity.status,
      descriptionForAi: entity.descriptionForAi,
    };
  }
}
