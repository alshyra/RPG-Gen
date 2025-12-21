import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ValidateNested, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { RaceResponseDto } from "./RaceResponseDto.js";
import { SkillResponseDto } from "./SkillResponseDto.js";
import { InventoryItemDto } from "./InventoryItemDto.js";
import { AptitudeResponseDto } from "./AptitudeResponseDto.js";
import { VoieProgressDto } from "./VoieProgressDto.js";
import { TacticalStats } from "./TacticalStats.js";
import { CharacterDocument } from "../../../infra/mongo/index.js";
import { InternalServerErrorException } from "@nestjs/common";

// Type guards for enum values
const isValidClassName = (value: unknown): value is 'guerrier' | 'rogue' | 'mage' => {
  return ['guerrier', 'rogue', 'mage'].includes(value as string);
};

const isValidRaceId = (value: unknown): value is 'humain' | 'nain' | 'elfe' | 'dark_elfe' | 'orc' => {
  return ['humain', 'nain', 'elfe', 'dark_elfe', 'orc'].includes(value as string);
};

export type CharacterState = "draft" | "created";

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
  className?: "guerrier" | "rogue" | "mage";

  @ApiPropertyOptional({ description: "Character level (1-20)" })
  level?: number;

  @ApiPropertyOptional({
    description: "Race ID (humain, nain, elfe, dark_elfe, orc)",
    enum: ["humain", "nain", "elfe", "dark_elfe", "orc"],
  })
  raceId?: "humain" | "nain" | "elfe" | "dark_elfe" | "orc";

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
  constructor(character: Partial<BaseCharacterResponseDto> | CharacterDocument) {
    if (!character) throw new InternalServerErrorException("CharacterResponseDto initialized without data");
    if (!character.characterId) throw new InternalServerErrorException("CharacterResponseDto initialized without characterId")
    
    this.characterId = character.characterId;
    this.name = character.name;
    this.hp = character.hp;
    this.hpMax = character.hpMax;
    this.totalXp = character.totalXp;
    
    if (character.portrait) {
      this.portrait = character.portrait;
    }
    if (character.state) {
      this.state = character.state as CharacterState;
    }
    
    this.gender = character.gender;
    this.inspirationPoints = character.inspirationPoints;
    this.isDeceased = character.isDeceased || false;
    this.inventory = character.inventory;
    this.diedAt = typeof character.diedAt == 'string' ? character.diedAt : character.diedAt?.toISOString();
    this.deathLocation = character.deathLocation;
    this.physicalDescription = character.physicalDescription;
    // Tactical system fields - validate enum values
    if (character.className && !isValidClassName(character.className)) {
      throw new InternalServerErrorException(`Invalid className: ${character.className}`);
    }
    if (character.raceId && !isValidRaceId(character.raceId)) {
      throw new InternalServerErrorException(`Invalid raceId: ${character.raceId}`);
    }
    this.className = character.className && isValidClassName(character.className) ? character.className : undefined;
    this.level = character.level;
    this.raceId = character.raceId && isValidRaceId(character.raceId) ? character.raceId : undefined;
    this.stats = character.stats;
    this.pa = character.pa;
    this.paMax = character.paMax;
    this.pm = character.pm;
    this.pmMax = character.pmMax;
  }
}
