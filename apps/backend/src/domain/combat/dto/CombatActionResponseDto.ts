import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { DiceResultDto } from "./DiceResultDto.js";
import { CombatDiceResultDto } from "./CombatDiceResultDto.js";

export enum ActionCost {
  ACTION = "action",
  BONUS_ACTION = "bonus-action",
  REACTION = "reaction",
  FREE = "free",
}

export class CombatActionResponseDto {
  @ApiProperty({ description: "Whether the action was successful" })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: "Cost of the action",
    enum: ActionCost,
  })
  @IsEnum(ActionCost)
  cost: ActionCost;

  @ApiPropertyOptional({ description: "Whether attack/spell hit (if applicable)" })
  @IsOptional()
  @IsBoolean()
  hit?: boolean;

  @ApiPropertyOptional({ description: "Damage dealt (if applicable)" })
  @IsOptional()
  @IsNumber()
  damage?: number;

  @ApiPropertyOptional({ description: "Healing restored (if applicable)" })
  @IsOptional()
  @IsNumber()
  healing?: number;

  @ApiPropertyOptional({ description: "Description of action result" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Error message if action failed" })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: "Dice roll result (for attacks)",
    type: () => DiceResultDto,
  })
  @IsOptional()
  @IsObject()
  diceResult?: DiceResultDto;

  @ApiPropertyOptional({
    description: "Damage dice result details",
    type: () => CombatDiceResultDto,
  })
  @IsOptional()
  @IsObject()
  damageDiceResult?: CombatDiceResultDto;

  @ApiPropertyOptional({ description: "Total damage dealt (convenience field)" })
  @IsOptional()
  @IsNumber()
  damageTotal?: number;

  @ApiPropertyOptional({ description: "Whether the attack was a critical hit" })
  @IsOptional()
  @IsBoolean()
  isCrit?: boolean;

  @ApiPropertyOptional({ description: "Narrative text (e.g., for combat end)" })
  @IsOptional()
  @IsString()
  narrative?: string;

  constructor(init?: Partial<CombatActionResponseDto>) {
    this.cost = init?.cost ?? ActionCost.FREE;
    this.damage = init?.damage;
    this.damageDiceResult = init?.damageDiceResult;
    this.damageTotal = init?.damageTotal;
    this.description = init?.description;
    this.diceResult = init?.diceResult;
    this.errorMessage = init?.errorMessage;
    this.healing = init?.healing;
    this.hit = init?.hit;
    this.isCrit = init?.isCrit;
    this.narrative = init?.narrative;
    this.success = init?.success ?? false;
  }
}
