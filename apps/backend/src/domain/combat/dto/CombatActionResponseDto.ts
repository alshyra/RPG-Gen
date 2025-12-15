import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { CombatStateDto } from "./CombatStateDto.js";
import { CombatEndDto } from "./CombatEndDto.js";
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

  @ApiProperty({ description: "Remaining actions for current turn" })
  @IsNumber()
  actionsRemaining: number;

  @ApiProperty({ description: "Remaining bonus actions for current turn" })
  @IsNumber()
  bonusActionsRemaining: number;

  @ApiPropertyOptional({ description: "Active effects for current turn (dash, disengage, etc.)" })
  @IsOptional()
  activeEffects?: string[];

  @ApiPropertyOptional({
    description: "Full combat state after action",
    type: () => CombatStateDto,
  })
  @IsOptional()
  @IsObject()
  combatState?: CombatStateDto;

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

  @ApiPropertyOptional({
    description: "Combat end result if combat finished",
    type: () => CombatEndDto,
  })
  @IsOptional()
  @IsObject()
  combatEnd?: CombatEndDto;

  @ApiPropertyOptional({ description: "Narrative text (e.g., for combat end)" })
  @IsOptional()
  @IsString()
  narrative?: string;
}
