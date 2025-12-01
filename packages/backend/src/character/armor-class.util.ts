import type { CharacterResponseDto } from './dto/CharacterResponseDto.js';
import { ArmorMeta } from './dto/InventoryItemMeta.js';
import { ItemResponseDto } from './dto/ItemResponseDto.js';

interface ParsedAc {
  baseAc: number;
  addDex: boolean;
  maxDex: number | null;
}

interface EquippedGear {
  armor?: ItemResponseDto<ArmorMeta>;
  shield?: ItemResponseDto<ArmorMeta>;
}

export const getDexModifier = (character: CharacterResponseDto): number => {
  const dexScore = character.scores?.Dex ?? 10;
  return Math.floor((dexScore - 10) / 2);
};

const parseShieldAc = (trimmed: string): ParsedAc | null => {
  if (trimmed.startsWith('+')) {
    return { baseAc: parseInt(trimmed, 10), addDex: false, maxDex: null };
  }
  return null;
};

const parseHeavyArmorAc = (trimmed: string): ParsedAc | null => {
  if (/^\d+$/.test(trimmed)) {
    return { baseAc: parseInt(trimmed, 10), addDex: false, maxDex: null };
  }
  return null;
};

const parseLightArmorAc = (trimmed: string): ParsedAc | null => {
  const match = trimmed.match(/^(\d+)\s*\+\s*Dex modifier$/i);
  if (match) {
    return { baseAc: parseInt(match[1], 10), addDex: true, maxDex: null };
  }
  return null;
};

const parseMediumArmorAc = (trimmed: string): ParsedAc | null => {
  const match = trimmed.match(/^(\d+)\s*\+\s*Dex modifier\s*\(max\s*(\d+)\)$/i);
  if (match) {
    return { baseAc: parseInt(match[1], 10), addDex: true, maxDex: parseInt(match[2], 10) };
  }
  return null;
};

export const parseArmorAc = (acString: string): ParsedAc => {
  const trimmed = acString.trim();
  return parseShieldAc(trimmed)
    ?? parseHeavyArmorAc(trimmed)
    ?? parseLightArmorAc(trimmed)
    ?? parseMediumArmorAc(trimmed)
    ?? { baseAc: 0, addDex: false, maxDex: null };
};

const isItemArmor = (item: ItemResponseDto): item is ItemResponseDto<ArmorMeta> => item.meta?.type === 'armor';

const findEquippedGear = (inventory: ItemResponseDto[]): EquippedGear => {
  const equippedItems = inventory.filter(item => item.equipped && isItemArmor(item)) as ItemResponseDto<ArmorMeta>[];
  const shield = equippedItems.find(item => item.meta?.class === 'Shield');
  const armor = equippedItems.find(item => item.meta?.class !== 'Shield');
  return { armor, shield };
};

const computeArmorBonus = (armor: ItemResponseDto<ArmorMeta> | undefined, dexMod: number): { baseAc: number; dexBonus: number } => {
  if (!armor?.meta?.ac) {
    return { baseAc: 10, dexBonus: dexMod };
  }
  const parsed = parseArmorAc(String(armor.meta.ac));
  if (!parsed.addDex) {
    return { baseAc: parsed.baseAc, dexBonus: 0 };
  }
  const dexBonus = parsed.maxDex !== null ? Math.min(dexMod, parsed.maxDex) : dexMod;
  return { baseAc: parsed.baseAc, dexBonus };
};

const computeShieldBonus = (shield: ItemResponseDto<ArmorMeta> | undefined): number => {
  if (!shield?.meta?.ac) return 0;
  return parseArmorAc(String(shield.meta.ac)).baseAc;
};

export const calculateArmorClass = (character: CharacterResponseDto): number => {
  const dexMod = getDexModifier(character);
  const { armor, shield } = findEquippedGear(character.inventory ?? []);
  const { baseAc, dexBonus } = computeArmorBonus(armor, dexMod);
  return baseAc + dexBonus + computeShieldBonus(shield);
};
