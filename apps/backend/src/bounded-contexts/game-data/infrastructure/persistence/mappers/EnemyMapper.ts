import { EnemyDefinition } from '../../../domain/enemy/entities/EnemyDefinition.js';
import { EnemyDocument } from '../mongo/schemas/EnemyDocument.js';

/**
 * Mapper for EnemyDefinition entity ↔ EnemyDocument
 * 
 * @infrastructure game-data
 */
export class EnemyMapper {
  /**
   * Map MongoDB document to domain entity
   */
  static toDomain(doc: EnemyDocument): EnemyDefinition {
    return new EnemyDefinition({
      id: doc.enemyId,
      name: doc.name,
      hp: doc.hp,
      attackBonus: doc.attackBonus,
      damageDice: doc.damageDice,
      damageBonus: doc.damageBonus,
      aptitudes: doc.aptitudes,
      level: doc.level,
    });
  }

  /**
   * Map domain entity to MongoDB document data
   */
  static toPersistence(entity: EnemyDefinition): Partial<EnemyDocument> {
    return {
      enemyId: entity.id,
      name: entity.name,
      hp: entity.hp,
      attackBonus: entity.attackBonus,
      damageDice: entity.damageDice,
      damageBonus: entity.damageBonus,
      aptitudes: [...entity.aptitudes],
      level: entity.level,
    };
  }
}
