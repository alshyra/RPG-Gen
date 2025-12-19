import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CombatantDto } from "./CombatantDto.js";
import { CombatEndDto } from "./CombatEndDto.js";
import {
  IsString,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * CombatStateDto - Combat state for the tactical system
 * 
 * Uses PA/PM resource economy (stored on CombatantDto)
 * No attack rolls, AC, or bonus actions
 */
export class CombatStateDto {
  @ApiProperty({ description: "Character ID" })
  @IsString()
  characterId: string;

  @ApiProperty({ description: "Whether currently in combat" })
  @IsBoolean()
  inCombat: boolean;

  @ApiProperty({
    description: "Active enemies",
    type: [CombatantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombatantDto)
  enemies: CombatantDto[];

  @ApiProperty({
    description: "Player state",
    type: CombatantDto,
  })
  @ValidateNested()
  @Type(() => CombatantDto)
  player: CombatantDto;

  @ApiProperty({
    description: "Turn order for combat",
    type: [CombatantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombatantDto)
  turnOrder: CombatantDto[];

  @ApiProperty({ description: "Index of current turn in turnOrder" })
  @IsNumber()
  currentTurnIndex: number;

  @ApiProperty({ description: "Current round number" })
  @IsNumber()
  roundNumber: number;

  @ApiPropertyOptional({ description: "Narrative summary of current combat" })
  @IsOptional()
  @IsString()
  narrative?: string;

  @ApiPropertyOptional({ description: "Active status effects (stunned, burning, etc.)" })
  @IsOptional()
  @IsArray()
  activeEffects?: string[];

  @ApiPropertyOptional({
    description: "Combat end result, populated when combat ends (inCombat=false)",
    type: () => CombatEndDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CombatEndDto)
  combatEnd?: CombatEndDto;

  constructor(init?: Partial<CombatStateDto>) {
    Object.assign(this, init);
    // If combat has ended (inCombat=false), player/enemies/turnOrder are optional
    if (this.inCombat !== false && (!this.player || !this.enemies || !this.turnOrder)) {
      throw new Error("CombatStateDto requires player, enemies, and turnOrder to be provided");
    }
    // defaults
    this.enemies = this.enemies ?? [];
    this.player =
      this.player ??
      new CombatantDto({
        isPlayer: true,
        id: "",
        initiative: 0,
      });
    this.turnOrder = this.turnOrder ?? [];
    this.characterId = this.characterId ?? "";
    this.inCombat = this.inCombat ?? false;
    this.currentTurnIndex = this.currentTurnIndex ?? 0;
    this.roundNumber = this.roundNumber ?? 1;
    this.activeEffects = this.activeEffects ?? [];
  }
}
