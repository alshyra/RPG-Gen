import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { type StatAttribute } from "../../../../character/api/dto/response/StatAttribute.js";
import { TacticalStats } from "../../../../character/api/dto/response/TacticalStats.js";

/**
 * CombatantDto - Unified combatant representation for the new tactical system
 * 
 * Replaces D&D mechanics (attackBonus, AC, damageDice) with:
 * - PA/PM resource system
 * - Attribute-based scaling (vigor, finesse, mind, survival)
 * - Fixed damage calculations based on basePower + level scaling
 */
export class CombatantDto {
  @ApiProperty({ description: "ID of the combatant (player character or enemy)" })
  @IsString()
  id: string;

  @ApiProperty({ description: "Combatant name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Initiative order value (finesse-based)" })
  @IsNumber()
  initiative: number;

  @ApiProperty({ description: "Whether combatant is player character" })
  @IsBoolean()
  isPlayer: boolean;

  @ApiPropertyOptional({ description: "Current hit points" })
  @IsNumber()
  hp: number;

  @ApiPropertyOptional({ description: "Maximum hit points" })
  @IsNumber()
  hpMax: number;

  // === New Tactical System Fields ===

  @ApiPropertyOptional({ description: "Current action points (PA)" })
  @IsOptional()
  @IsNumber()
  pa?: number;

  @ApiPropertyOptional({ description: "Maximum action points (PA)" })
  @IsOptional()
  @IsNumber()
  paMax?: number;

  @ApiPropertyOptional({ description: "Current movement points (PM)" })
  @IsOptional()
  @IsNumber()
  pm?: number;

  @ApiPropertyOptional({ description: "Maximum movement points (PM)" })
  @IsOptional()
  @IsNumber()
  pmMax?: number;

  @ApiPropertyOptional({ description: "Combatant level (1-20)" })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiPropertyOptional({ description: "Class name (guerrier, rogue, mage)" })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional({ description: "Base power for attacks (used in damage formula)" })
  @IsOptional()
  @IsNumber()
  basePower?: number;

  @ApiPropertyOptional({ description: "Which attribute scales damage (vigor, finesse, mind, survival)" })
  @IsOptional()
  @IsString()
  scalingAttribute?: StatAttribute;

  @ApiPropertyOptional({
    description: "Combat stats (vigor, finesse, mind, survival)",
    type: TacticalStats,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TacticalStats)
  stats?: TacticalStats;

  @ApiPropertyOptional({ description: "Combat side (player or enemy)" })
  @IsOptional()
  @IsString()
  side?: "player" | "enemy";

  @ApiPropertyOptional({ description: "Grid position for tactical combat" })
  @IsOptional()
  position?: { x: number; y: number };

  constructor(init?: Partial<CombatantDto>) {
    Object.assign(this, init);
    // defaults
    if (this.isPlayer === undefined) this.isPlayer = false;
    if (this.initiative === undefined) this.initiative = 0;
    if (this.level === undefined) this.level = 1;
    if (this.side === undefined) this.side = this.isPlayer ? "player" : "enemy";
  }
}
