import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsString, ValidateNested, IsArray, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { AptitudeScalingDto } from "./AptitudeScalingDto.js";

export type AptitudeTargetType = "self" | "enemy" | "ally" | "zone" | "all_enemies" | "all_allies";
export type AptitudeCategory = "attack" | "defense" | "support" | "movement" | "utility";

export class AptitudeResponseDto {
  @ApiProperty({ description: "Unique aptitude ID" })
  @IsString()
  aptitudeId: string;

  @ApiProperty({ description: "Display name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Mechanical description" })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: "Narrative description for AI" })
  @IsString()
  descriptionForAi?: string;

  @ApiProperty({ description: "Action points cost" })
  @IsNumber()
  paCost: number;

  @ApiPropertyOptional({ description: "Movement points cost" })
  @IsNumber()
  pmCost?: number;

  @ApiProperty({ description: "Cooldown in turns" })
  @IsNumber()
  cooldown: number;

  @ApiProperty({ description: "Target type (self, enemy, ally, zone, all_enemies, all_allies)" })
  @IsEnum(["self", "enemy", "ally", "zone", "all_enemies", "all_allies"])
  targetType: AptitudeTargetType;

  @ApiProperty({ description: "Range in tiles (1 = melee)" })
  @IsNumber()
  range: number;

  @ApiPropertyOptional({ description: "Area of effect radius in tiles (0 = single target)" })
  @IsNumber()
  areaOfEffect?: number;

  @ApiProperty({ description: "Category (attack, defense, support, movement, utility)" })
  @IsEnum(["attack", "defense", "support", "movement", "utility"])
  category: AptitudeCategory;

  @ApiPropertyOptional({ description: "Base power value" })
  @IsNumber()
  basePower?: number;

  @ApiPropertyOptional({ description: "Scaling configuration" })
  @ValidateNested()
  @Type(() => AptitudeScalingDto)
  scaling?: AptitudeScalingDto;

  @ApiPropertyOptional({ description: "Status effects applied" })
  @IsArray()
  @IsString({ each: true })
  appliesStatus?: string[];

  @ApiPropertyOptional({ description: "Duration of applied status effects" })
  @IsNumber()
  statusDuration?: number;

  @ApiPropertyOptional({ description: "Class restriction (guerrier, rogue, mage) or undefined for universal" })
  @IsString()
  classRestriction?: string;

  @ApiPropertyOptional({ description: "Voie ID this aptitude belongs to" })
  @IsString()
  voieId?: string;

  @ApiPropertyOptional({ description: "Minimum rank required to unlock (1-5)" })
  @IsNumber()
  rankRequired?: number;

  @ApiPropertyOptional({ description: "Is this a starting aptitude?" })
  isStarting?: boolean;

  @ApiPropertyOptional({ description: "Damage type (physical, magical, fire, ice, etc.)" })
  @IsString()
  damageType?: string;

  @ApiPropertyOptional({ description: "Current cooldown turns remaining (0 = ready)" })
  @IsNumber()
  currentCooldown?: number;

  constructor(init?: Partial<AptitudeResponseDto>) {
    // Validate required fields
    if (!init?.aptitudeId) {
      throw new Error("AptitudeResponseDto: missing required field 'aptitudeId'");
    }
    if (!init?.name) {
      throw new Error("AptitudeResponseDto: missing required field 'name'");
    }
    if (!init?.description) {
      throw new Error("AptitudeResponseDto: missing required field 'description'");
    }
    if (init?.paCost === undefined) {
      throw new Error("AptitudeResponseDto: missing required field 'paCost'");
    }
    if (init?.cooldown === undefined) {
      throw new Error("AptitudeResponseDto: missing required field 'cooldown'");
    }
    if (!init?.targetType) {
      throw new Error("AptitudeResponseDto: missing required field 'targetType'");
    }
    if (init?.range === undefined) {
      throw new Error("AptitudeResponseDto: missing required field 'range'");
    }
    if (!init?.category) {
      throw new Error("AptitudeResponseDto: missing required field 'category'");
    }

    Object.assign(this, init);
  }
}
