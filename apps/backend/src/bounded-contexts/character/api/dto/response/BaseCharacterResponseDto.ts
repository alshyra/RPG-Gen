import { RaceIdEnum, type ArchetypeName, type RaceId } from "#shared/domain/index.js";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { AptitudeResponseDto } from "./AptitudeResponseDto.js";
import { InventoryItemDto } from "./InventoryItemDto.js";
import { RaceResponseDto } from "./RaceResponseDto.js";
import { SkillResponseDto } from "./SkillResponseDto.js";
import { TacticalStats } from "./TacticalStats.js";
import { VoieProgressDto } from "./VoieProgressDto.js";
import { type CharacterState } from "#character/domain/entities/CharacterEntity.js";

/**
 * Tactical system stats (Vigor, Finesse, Mind, Survival)
 */
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

  @ApiPropertyOptional({ description: "Character portrait URL or base64" })
  portrait?: string;

  @ApiPropertyOptional({ description: "Character gender" })
  gender?: string;

  @ApiPropertyOptional({ description: "Inspiration points" })
  inspirationPoints?: number;

  @ApiProperty({ description: "Whether character is deceased" })
  isDeceased?: boolean;

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
    description: "Character aptitudes (learned abilities)",
    type: [AptitudeResponseDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AptitudeResponseDto)
  @IsArray()
  aptitudes?: AptitudeResponseDto[];

  // === Tactical System Fields ===

  @ApiPropertyOptional({
    description: "Character class (guerrier, rogue, mage)",
    enum: ["guerrier", "rogue", "mage"],
  })
  className?: ArchetypeName;

  @ApiPropertyOptional({ description: "Character level (1-20)" })
  level?: number;

  @ApiPropertyOptional({
    description: "Race ID (humain, nain, elfe, dark_elfe, orc)",
    enum: RaceIdEnum,
  })
  raceId?: RaceId;

  @ApiPropertyOptional({
    description: "Tactical stats (vigor, finesse, mind, survival)",
    type: TacticalStats,
  })
  @ValidateNested()
  @Type(() => TacticalStats)
  stats?: TacticalStats;

  @ApiPropertyOptional({ description: "Current action points" })
  pa?: number;

  @ApiPropertyOptional({ description: "Maximum action points" })
  paMax?: number;

  @ApiPropertyOptional({ description: "Current movement points" })
  pm?: number;

  @ApiPropertyOptional({ description: "Maximum movement points" })
  pmMax?: number;

  @ApiPropertyOptional({ description: "Unspent talent points" })
  talentPoints?: number;

  @ApiPropertyOptional({
    description: "Talent tree progression",
    type: [VoieProgressDto],
  })
  @ValidateNested({ each: true })
  @Type(() => VoieProgressDto)
  @IsArray()
  voies?: VoieProgressDto[];
}
