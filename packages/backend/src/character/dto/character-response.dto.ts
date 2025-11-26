import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Race DTO for Swagger documentation
 */
export class RaceResponseDto {
  @ApiPropertyOptional({ description: 'Race ID' })
  id?: string;

  @ApiPropertyOptional({ description: 'Race name' })
  name?: string;

  @ApiProperty({ description: 'Ability score modifiers', additionalProperties: { type: 'number' } })
  mods: Record<string, number>;
}

/**
 * Ability Scores DTO for Swagger documentation
 */
export class AbilityScoresResponseDto {
  @ApiPropertyOptional({ description: 'Strength score' })
  Str?: number;

  @ApiPropertyOptional({ description: 'Dexterity score' })
  Dex?: number;

  @ApiPropertyOptional({ description: 'Constitution score' })
  Con?: number;

  @ApiPropertyOptional({ description: 'Intelligence score' })
  Int?: number;

  @ApiPropertyOptional({ description: 'Wisdom score' })
  Wis?: number;

  @ApiPropertyOptional({ description: 'Charisma score' })
  Cha?: number;
}

/**
 * Character Class DTO for Swagger documentation
 */
export class CharacterClassResponseDto {
  @ApiPropertyOptional({ description: 'Class name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Class level' })
  level?: number;
}

/**
 * Skill DTO for Swagger documentation
 */
export class SkillResponseDto {
  @ApiPropertyOptional({ description: 'Skill name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Is proficient in this skill' })
  proficient?: boolean;

  @ApiPropertyOptional({ description: 'Skill modifier' })
  modifier?: number;
}

/**
 * Inventory Item DTO for Swagger documentation
 */
export class ItemResponseDto {
  @ApiPropertyOptional({ description: 'Item ID' })
  _id?: string;

  @ApiPropertyOptional({ description: 'Definition ID' })
  definitionId?: string;

  @ApiPropertyOptional({ description: 'Item name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  qty?: number;

  @ApiPropertyOptional({ description: 'Item description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Is equipped' })
  equipped?: boolean;

  @ApiPropertyOptional({ description: 'Item metadata', additionalProperties: true })
  meta?: Record<string, unknown>;
}

/**
 * Spell DTO for Swagger documentation
 */
export class SpellResponseDto {
  @ApiProperty({ description: 'Spell name' })
  name: string;

  @ApiPropertyOptional({ description: 'Spell level' })
  level?: number;

  @ApiPropertyOptional({ description: 'Spell description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Spell metadata', additionalProperties: true })
  meta?: Record<string, unknown>;
}

/**
 * Character DTO for API responses - Swagger documented
 */
export class CharacterResponseDto {
  @ApiProperty({ description: 'Unique character ID (UUID)' })
  characterId: string;

  @ApiPropertyOptional({ description: 'Character name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Physical description of the character' })
  physicalDescription?: string;

  @ApiPropertyOptional({ description: 'Character race', type: RaceResponseDto })
  race?: RaceResponseDto;

  @ApiPropertyOptional({ description: 'Ability scores', type: AbilityScoresResponseDto })
  scores?: AbilityScoresResponseDto;

  @ApiPropertyOptional({ description: 'Current hit points' })
  hp?: number;

  @ApiPropertyOptional({ description: 'Maximum hit points' })
  hpMax?: number;

  @ApiPropertyOptional({ description: 'Total experience points' })
  totalXp?: number;

  @ApiPropertyOptional({ description: 'Character classes', type: [CharacterClassResponseDto] })
  classes?: CharacterClassResponseDto[];

  @ApiPropertyOptional({ description: 'Character skills', type: [SkillResponseDto] })
  skills?: SkillResponseDto[];

  @ApiProperty({ description: 'Game world (e.g., dnd, vtm)' })
  world: string;

  @ApiProperty({ description: 'Character portrait URL or base64' })
  portrait: string;

  @ApiPropertyOptional({ description: 'Character gender' })
  gender?: string;

  @ApiPropertyOptional({ description: 'Proficiency bonus' })
  proficiency?: number;

  @ApiPropertyOptional({ description: 'Inspiration points' })
  inspirationPoints?: number;

  @ApiProperty({ description: 'Whether character is deceased' })
  isDeceased: boolean;

  @ApiPropertyOptional({ description: 'Date of death (ISO string)' })
  diedAt?: Date;

  @ApiPropertyOptional({ description: 'Location where character died' })
  deathLocation?: string;

  @ApiProperty({ description: 'Character state', enum: [
    'draft', 'created',
  ] })
  state: 'draft' | 'created';

  @ApiPropertyOptional({ description: 'Character inventory', type: [ItemResponseDto] })
  inventory?: ItemResponseDto[];

  @ApiPropertyOptional({ description: 'Character spells', type: [SpellResponseDto] })
  spells?: SpellResponseDto[];
}

/**
 * Deceased character entry with death information
 */
export class DeceasedCharacterResponseDto {
  @ApiProperty({ description: 'Unique character ID (UUID)' })
  characterId: string;

  @ApiPropertyOptional({ description: 'Character name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Physical description of the character' })
  physicalDescription?: string;

  @ApiPropertyOptional({ description: 'Character race', type: RaceResponseDto })
  race?: RaceResponseDto;

  @ApiPropertyOptional({ description: 'Ability scores', type: AbilityScoresResponseDto })
  scores?: AbilityScoresResponseDto;

  @ApiPropertyOptional({ description: 'Current hit points' })
  hp?: number;

  @ApiPropertyOptional({ description: 'Maximum hit points' })
  hpMax?: number;

  @ApiPropertyOptional({ description: 'Total experience points' })
  totalXp?: number;

  @ApiPropertyOptional({ description: 'Character classes', type: [CharacterClassResponseDto] })
  classes?: CharacterClassResponseDto[];

  @ApiPropertyOptional({ description: 'Character skills', type: [SkillResponseDto] })
  skills?: SkillResponseDto[];

  @ApiProperty({ description: 'Game world (e.g., dnd, vtm)' })
  world: string;

  @ApiProperty({ description: 'Character portrait URL or base64' })
  portrait: string;

  @ApiPropertyOptional({ description: 'Character gender' })
  gender?: string;

  @ApiPropertyOptional({ description: 'Proficiency bonus' })
  proficiency?: number;

  @ApiPropertyOptional({ description: 'Inspiration points' })
  inspirationPoints?: number;

  @ApiProperty({ description: 'Whether character is deceased' })
  isDeceased: boolean;

  @ApiPropertyOptional({ description: 'Date of death (ISO string)' })
  diedAt?: string;

  @ApiPropertyOptional({ description: 'Location where character died' })
  deathLocation?: string;

  @ApiProperty({ description: 'Character state', enum: [
    'draft', 'created',
  ] })
  state: 'draft' | 'created';

  @ApiPropertyOptional({ description: 'Character inventory', type: [ItemResponseDto] })
  inventory?: ItemResponseDto[];

  @ApiPropertyOptional({ description: 'Character spells', type: [SpellResponseDto] })
  spells?: SpellResponseDto[];
}

/**
 * Simple message response
 */
export class MessageResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;
}

/**
 * Inspiration action response
 */
export class InspirationResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  ok: boolean;

  @ApiProperty({ description: 'Updated inspiration points count' })
  inspirationPoints: number;

  @ApiProperty({ description: 'Updated character', type: CharacterResponseDto })
  character: CharacterResponseDto;
}

/**
 * Create character request body
 */
export class CreateCharacterBodyDto {
  @ApiProperty({ description: 'Game world (e.g., dnd, vtm)' })
  world: string;
}

/**
 * Kill character request body
 */
export class KillCharacterBodyDto {
  @ApiPropertyOptional({ description: 'Location where character died' })
  deathLocation?: string;
}

/**
 * Remove inventory item request body
 */
export class RemoveInventoryBodyDto {
  @ApiPropertyOptional({ description: 'Quantity to remove (0 = remove all)' })
  qty?: number;
}

/**
 * Grant inspiration request body
 */
export class GrantInspirationBodyDto {
  @ApiPropertyOptional({ description: 'Amount of inspiration to grant (1-5)', default: 1 })
  amount?: number;
}
