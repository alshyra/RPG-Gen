import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DiceResultDto } from "../../../../game-narrative/api/dto/dice/DiceResultDto.js";
import { CombatDiceResultDto } from "../../../../game-narrative/api/dto/dice/CombatDiceResultDto.js";

/**
 * Represents a single enemy attack action during enemy turn.
 * Used to replay attacks with animations on the frontend.
 */
export class EnemyAttackLogDto {
  @ApiProperty({
    description: "ID of the attacking enemy",
    example: "goblin-1",
  })
  attackerId: string;

  @ApiProperty({
    description: "Name of the attacking enemy",
    example: "Goblin",
  })
  attackerName: string;

  @ApiProperty({
    description: "ID of the target (player characterId)",
    example: "char-123",
  })
  targetId: string;

  @ApiPropertyOptional({
    description: "Damage roll result",
    type: CombatDiceResultDto,
  })
  damageRoll?: CombatDiceResultDto;

  @ApiPropertyOptional({
    description: "Total damage dealt (0 if miss)",
    example: 5,
  })
  damageTotal?: number;

  @ApiPropertyOptional({
    description: "Whether the attack was a critical hit",
    example: false,
  })
  isCrit?: boolean;
}
