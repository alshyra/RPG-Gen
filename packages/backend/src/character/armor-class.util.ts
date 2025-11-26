import type { CharacterDto, ItemDto } from '@rpg-gen/shared';

/**
 * Get Dexterity modifier from ability scores
 */
export const getDexModifier = (character: CharacterDto): number => {
  const dexScore = character.scores?.Dex ?? 10;
  return Math.floor((dexScore - 10) / 2);
};

/**
 * Parse the AC string from armor definition meta
 * @returns { baseAc: number, addDex: boolean, maxDex: number | null }
 */
export const parseArmorAc = (acString: string): { baseAc: number; addDex: boolean; maxDex: number | null } => {
  const trimmed = acString.trim();

  // Shield case: "+2"
  if (trimmed.startsWith('+')) {
    return { baseAc: parseInt(trimmed, 10), addDex: false, maxDex: null };
  }

  // Heavy armor case: just a number like "14", "16", "17", "18"
  if (/^\d+$/.test(trimmed)) {
    return { baseAc: parseInt(trimmed, 10), addDex: false, maxDex: null };
  }

  // Light armor case: "11 + Dex modifier" or "12 + Dex modifier"
  const lightArmorMatch = trimmed.match(/^(\d+)\s*\+\s*Dex modifier$/i);
  if (lightArmorMatch) {
    return { baseAc: parseInt(lightArmorMatch[1], 10), addDex: true, maxDex: null };
  }

  // Medium armor case: "12 + Dex modifier (max 2)" or similar
  const mediumArmorMatch = trimmed.match(/^(\d+)\s*\+\s*Dex modifier\s*\(max\s*(\d+)\)$/i);
  if (mediumArmorMatch) {
    return { baseAc: parseInt(mediumArmorMatch[1], 10), addDex: true, maxDex: parseInt(mediumArmorMatch[2], 10) };
  }

  // Default: couldn't parse, return 0 base with no dex
  return { baseAc: 0, addDex: false, maxDex: null };
};

/**
 * Calculate Armor Class for a character based on equipped armor and shield
 *
 * D&D 5e AC Rules:
 * - Unarmored: 10 + DEX modifier
 * - Light Armor: Armor AC + full DEX modifier
 * - Medium Armor: Armor AC + DEX modifier (max 2)
 * - Heavy Armor: Armor AC (no DEX modifier)
 * - Shield: +2 AC bonus
 */
export const calculateArmorClass = (character: CharacterDto): number => {
  const dexMod = getDexModifier(character);
  const inventory = character.inventory ?? [];

  // Find equipped armor and shield
  const equippedItems = inventory.filter((item: ItemDto) => item.equipped);

  let equippedArmor: ItemDto | undefined;
  let equippedShield: ItemDto | undefined;

  for (const item of equippedItems) {
    const itemType = item.meta?.type;
    const itemClass = item.meta?.class;

    if (itemType === 'armor') {
      if (itemClass === 'Shield') {
        equippedShield = item;
      } else if (!equippedArmor) {
        // Take first non-shield armor
        equippedArmor = item;
      }
    }
  }

  let baseAc = 10; // Default unarmored AC
  let dexBonus = dexMod; // Full DEX bonus by default

  if (equippedArmor && equippedArmor.meta?.ac) {
    const parsed = parseArmorAc(String(equippedArmor.meta.ac));

    if (parsed.addDex) {
      // Light or Medium armor
      baseAc = parsed.baseAc;
      if (parsed.maxDex !== null) {
        // Medium armor caps DEX bonus
        dexBonus = Math.min(dexMod, parsed.maxDex);
      }
    } else {
      // Heavy armor or invalid: use base AC, no DEX bonus
      baseAc = parsed.baseAc;
      dexBonus = 0;
    }
  }

  let totalAc = baseAc + dexBonus;

  // Add shield bonus
  if (equippedShield && equippedShield.meta?.ac) {
    const shieldParsed = parseArmorAc(String(equippedShield.meta.ac));
    totalAc += shieldParsed.baseAc; // Shield AC is typically "+2"
  }

  return totalAc;
};
