import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ValidateNested, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { RaceResponseDto } from "./RaceResponseDto.js";
import { SkillResponseDto } from "./SkillResponseDto.js";
import { InventoryItemDto } from "./InventoryItemDto.js";
import { SpellResponseDto } from "./SpellResponseDto.js";

export type CharacterState = "draft" | "created";

/**
 * Tactical system stats (Vigor, Finesse, Mind, Survival)
 */
export interface TacticalStats {
  vigor: number;
  finesse: number;
  mind: number;
  survival: number;
}

export class BaseCharacterResponseDto {
  @ApiProperty({ description: "Unique character ID (UUID)" })
  characterId: string;

  @ApiPropertyOptional({ description: "Character name" })
  name?: string;

  @ApiPropertyOptional({ description: "Physical description of the character" })
  physicalDescription?: string;

  @ApiPropertyOptional({
    description: "Character race (new system)",
    type: RaceResponseDto,
  })
  race?: RaceResponseDto;

  @ApiPropertyOptional({ description: "Current hit points" })
  hp?: number;

  @ApiPropertyOptional({ description: "Maximum hit points" })
  hpMax?: number;

  @ApiPropertyOptional({ description: "Total experience points" })
  totalXp?: number;

  @ApiPropertyOptional({
    description: "Character skills",
    type: [SkillResponseDto],
  })
  skills?: SkillResponseDto[];

  @ApiProperty({ description: "Character portrait URL or base64" })
  portrait: string;

  @ApiPropertyOptional({ description: "Character gender" })
  gender?: string;

  @ApiPropertyOptional({ description: "Inspiration points" })
  inspirationPoints?: number;

  @ApiProperty({ description: "Whether character is deceased" })
  isDeceased: boolean;

  @ApiPropertyOptional({ description: "Date of death (ISO string)" })
  diedAt?: string;

  @ApiPropertyOptional({ description: "Location where character died" })
  deathLocation?: string;

  @ApiProperty({
    description: "Character state",
    enum: ["draft", "created"],
  })
  state: CharacterState;

  @ApiPropertyOptional({
    description: "Character inventory",
    type: [InventoryItemDto],
  })
  inventory?: InventoryItemDto[];

  @ApiPropertyOptional({
    description: "Character spells/aptitudes",
    type: [SpellResponseDto],
  })
  @ValidateNested({ each: true })
  @Type(() => SpellResponseDto)
  @IsArray()
  spells?: SpellResponseDto[];

  // === Tactical System Fields ===

  @ApiPropertyOptional({ description: "Character class (guerrier, rogue, mage)" })
  className?: string;

  @ApiPropertyOptional({ description: "Character level (1-20)" })
  level?: number;

  @ApiPropertyOptional({ description: "Race ID (humain, nain, elfe, orc)" })
  raceId?: string;

  @ApiPropertyOptional({ description: "Tactical stats (vigor, finesse, mind, survival)" })
  stats?: TacticalStats;

  @ApiPropertyOptional({ description: "Current action points" })
  pa?: number;

  @ApiPropertyOptional({ description: "Maximum action points" })
  paMax?: number;

  @ApiPropertyOptional({ description: "Current movement points" })
  pm?: number;

  @ApiPropertyOptional({ description: "Maximum movement points" })
  pmMax?: number;
}
