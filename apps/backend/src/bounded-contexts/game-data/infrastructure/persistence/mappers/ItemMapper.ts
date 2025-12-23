import { ItemDefinition, ItemSlot, ItemMeta } from '../../../domain/item/entities/ItemDefinition.js';
import { ItemDocument } from '../mongo/schemas/ItemDocument.js';

/**
 * Mapper for ItemDefinition entity ↔ ItemDocument
 * 
 * @infrastructure game-data
 */
export class ItemMapper {
  /**
   * Map MongoDB document to domain entity
   */
  static toDomain(doc: ItemDocument): ItemDefinition {
    return new ItemDefinition({
      definitionId: doc.definitionId,
      name: doc.name,
      description: doc.description,
      slot: doc.slot as ItemSlot | undefined,
      meta: doc.meta as ItemMeta,
    });
  }

  /**
   * Map domain entity to MongoDB document data
   */
  static toPersistence(entity: ItemDefinition): Partial<ItemDocument> {
    return {
      definitionId: entity.definitionId,
      name: entity.name,
      description: entity.description,
      slot: entity.slot,
      meta: entity.meta,
    };
  }
}
