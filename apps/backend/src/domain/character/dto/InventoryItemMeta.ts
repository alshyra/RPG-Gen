import { BaseMeta } from "./BaseMeta.js";
import { WeaponMeta } from "./WeaponMeta.js";
import { ArmorMeta } from "./ArmorMeta.js";
import { ConsumableMeta } from "./ConsumableMeta.js";
import { PackMeta } from "./PackMeta.js";
import { ToolMeta } from "./ToolMeta.js";
import { GenericMeta } from "./GenericMeta.js";

export type InventoryItemMeta =
  | WeaponMeta
  | ArmorMeta
  | ConsumableMeta
  | PackMeta
  | ToolMeta
  | GenericMeta;

export { BaseMeta, WeaponMeta, ArmorMeta, ConsumableMeta, PackMeta, ToolMeta, GenericMeta };

const hasTypeProp = (v: unknown): v is { type?: unknown } =>
  typeof v === "object" && v !== null && "type" in v;

export const isArmorMeta = (m: unknown): m is ArmorMeta =>
  hasTypeProp(m) && typeof m.type === "string" && m.type === "armor";
export const isWeaponMeta = (m: unknown): m is WeaponMeta =>
  hasTypeProp(m) && typeof m.type === "string" && m.type === "weapon";
