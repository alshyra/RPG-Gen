/**
 * ItemDefinition aggregate root
 * 
 * Represents an item definition (weapon, armor, consumable, etc.)
 * This is READ-ONLY game data loaded from seed files.
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'accessory' | 'misc';
export type ItemSlot = 'head' | 'body' | 'weapon' | 'accessory' | 'consumable';
export type WeaponClass = 'Simple Melee' | 'Martial Melee' | 'Simple Ranged' | 'Martial Ranged';
export type ArmorClass = 'Light' | 'Medium' | 'Heavy' | 'Shield';

export interface ItemMeta {
  type?: ItemType;
  class?: WeaponClass | ArmorClass;
  cost?: string;
  damage?: string;
  armorClass?: number;
  weight?: string;
  properties?: string[];
  starter?: boolean;
}

export class ItemDefinition {
  readonly definitionId: string;
  readonly name: string;
  readonly description: string;
  readonly slot?: ItemSlot;
  readonly meta: ItemMeta;

  constructor(props: {
    definitionId: string;
    name: string;
    description?: string;
    slot?: ItemSlot;
    meta?: ItemMeta;
  }) {
    if (!props.definitionId) {
      throw new Error('Item definition ID is required');
    }
    if (!props.name) {
      throw new Error('Item name is required');
    }

    this.definitionId = props.definitionId;
    this.name = props.name;
    this.description = props.description ?? '';
    this.slot = props.slot;
    this.meta = props.meta ?? {};
  }

  /**
   * Factory method to create ItemDefinition from seed data
   */
  static fromSeedData(data: {
    definitionId: string;
    name: string;
    description?: string;
    slot?: ItemSlot;
    meta?: ItemMeta;
  }): ItemDefinition {
    return new ItemDefinition(data);
  }

  /**
   * Check if item is a weapon
   */
  isWeapon(): boolean {
    return this.meta.type === 'weapon' || this.definitionId.startsWith('weapon-');
  }

  /**
   * Check if item is armor
   */
  isArmor(): boolean {
    return this.meta.type === 'armor' || this.definitionId.startsWith('armor-');
  }

  /**
   * Check if item is a starter item
   */
  isStarter(): boolean {
    return this.meta.starter === true;
  }

  /**
   * Check if item has a specific property
   */
  hasProperty(property: string): boolean {
    return this.meta.properties?.includes(property) ?? false;
  }

  /**
   * Get damage dice (for weapons)
   */
  getDamageDice(): string | undefined {
    return this.meta.damage;
  }

  /**
   * Get armor class bonus (for armor)
   */
  getArmorClass(): number | undefined {
    return this.meta.armorClass;
  }
}
