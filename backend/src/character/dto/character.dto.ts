import type {
  Character,
  InventoryItem,
  Spell,
  Race,
  CharacterClass,
  Skill,
  AbilityScores,
  Gender,
} from '../../schemas/character.schema';

// Re-export selected small schema types as DTO-friendly aliases
export type RaceDto = Race;
export type CharacterClassDto = CharacterClass;
export type SkillDto = Skill;
export type AbilityScoresDto = AbilityScores;
export type InventoryItemDto = InventoryItem;
export type SpellDto = Spell;
export type GenderDto = Gender;

// Convert server-internal types (ObjectId etc) to plain JS types for the client
export type CharacterDto = Omit<Character, 'userId'>;

export type PartialCharacterDto = Partial<CharacterDto>;
