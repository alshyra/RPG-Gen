import { ItemDefinition } from '../entities/ItemDefinition.js';

/**
 * Injection token for IItemRepository
 */
export const ITEM_REPOSITORY = Symbol('ITEM_REPOSITORY');

/**
 * Repository interface for ItemDefinition
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies (Port)
 */
export abstract class IItemRepository {
  /**
   * Find an item by its definition ID
   */
  abstract findById(definitionId: string): Promise<ItemDefinition | null>;

  /**
   * Find multiple items by definition IDs
   */
  abstract findByIds(definitionIds: string[]): Promise<ItemDefinition[]>;

  /**
   * Find all items
   */
  abstract findAll(): Promise<ItemDefinition[]>;

  /**
   * Find items by type (weapon, armor, consumable, etc.)
   */
  abstract findByType(type: string): Promise<ItemDefinition[]>;

  /**
   * Find starter items
   */
  abstract findStarters(): Promise<ItemDefinition[]>;

  /**
   * Upsert an item definition (for seeding)
   */
  abstract upsert(item: ItemDefinition): Promise<void>;

  /**
   * Bulk upsert items (for seeding)
   */
  abstract bulkUpsert(items: ItemDefinition[]): Promise<void>;

  /**
   * Delete an item by definition ID
   */
  abstract delete(definitionId: string): Promise<void>;

  /**
   * Check if an item exists
   */
  abstract exists(definitionId: string): Promise<boolean>;
}
