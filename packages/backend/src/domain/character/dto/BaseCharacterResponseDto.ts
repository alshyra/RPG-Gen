import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import { RaceResponseDto } from './RaceResponseDto.js';
import { AbilityScoresResponseDto } from './AbilityScoresResponseDto.js';
import { CharacterClassResponseDto } from './CharacterClassResponseDto.js';
import { SkillResponseDto } from './SkillResponseDto.js';
import { InventoryItemDto } from './InventoryItemDto.js';
import { SpellResponseDto } from './SpellResponseDto.js';

export type CharacterState = 'draft' | 'created';

export class BaseCharacterResponseDto {
  @ApiProperty({ description: 'Unique character ID (UUID)' })
  characterId: string;

  @ApiPropertyOptional({ description: 'Character name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Physical description of the character' })
  physicalDescription?: string;

  @ApiPropertyOptional({
    description: 'Character race',
    type: RaceResponseDto,
  })
  race?: RaceResponseDto;

  @ApiPropertyOptional({
    description: 'Ability scores',
    type: AbilityScoresResponseDto,
  })
  scores?: AbilityScoresResponseDto;

  @ApiPropertyOptional({ description: 'Current hit points' })
  hp?: number;

  @ApiPropertyOptional({ description: 'Maximum hit points' })
  hpMax?: number;

  @ApiPropertyOptional({ description: 'Total experience points' })
  totalXp?: number;

  @ApiPropertyOptional({
    description: 'Character classes',
    type: [CharacterClassResponseDto],
  })
  classes?: CharacterClassResponseDto[];

  @ApiPropertyOptional({
    description: 'Character skills',
    type: [SkillResponseDto],
  })
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

  // Standardize dates to ISO strings for responses
  @ApiPropertyOptional({ description: 'Date of death (ISO string)' })
  diedAt?: string;

  @ApiPropertyOptional({ description: 'Location where character died' })
  deathLocation?: string;

  @ApiProperty({
    description: 'Character state',
    enum: [
      'draft',
      'created',
    ],
  })
  state: CharacterState;

  @ApiPropertyOptional({
    description: 'Character inventory',
    type: [InventoryItemDto],
  })
  inventory?: InventoryItemDto[];

  @ApiPropertyOptional({
    description: 'Character spells',
    type: [SpellResponseDto],
  })
  spells?: SpellResponseDto[];
}
