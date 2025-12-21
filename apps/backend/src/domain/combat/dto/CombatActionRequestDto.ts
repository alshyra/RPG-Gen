import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

/**
 * Combat action request - all actions are now aptitudes.
 * Even basic melee attack is an aptitude with PA cost.
 */
export class CombatActionRequestDto {
  @ApiProperty({
    description: "Aptitude ID to use (including basic attack, dash, etc.)",
  })
  @IsString()
  aptitudeId: string;

  @ApiPropertyOptional({
    description: "Target combatant ID (for aptitudes targeting enemies)",
  })
  @IsOptional()
  @IsString()
  targetId?: string;
}
