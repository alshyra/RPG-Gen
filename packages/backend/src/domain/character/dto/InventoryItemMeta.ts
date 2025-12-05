import { BaseMeta } from './BaseMeta.js';
import { WeaponMeta } from './WeaponMeta.js';
import { ArmorMeta } from './ArmorMeta.js';
import { ConsumableMeta } from './ConsumableMeta.js';
import { PackMeta } from './PackMeta.js';
import { ToolMeta } from './ToolMeta.js';
import { GenericMeta } from './GenericMeta.js';

export type InventoryItemMeta = WeaponMeta | ArmorMeta | ConsumableMeta | PackMeta | ToolMeta | GenericMeta;

export { BaseMeta, WeaponMeta, ArmorMeta, ConsumableMeta, PackMeta, ToolMeta, GenericMeta };

export const isWeaponMeta = (m: unknown): m is WeaponMeta => !!m && (m as any).type === 'weapon';
export const isArmorMeta = (m: unknown): m is ArmorMeta => !!m && (m as any).type === 'armor';
