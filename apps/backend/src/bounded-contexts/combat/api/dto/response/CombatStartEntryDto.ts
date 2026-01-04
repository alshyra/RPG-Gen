import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional } from "class-validator";

export class CombatStartEntryDto {
  @ApiProperty({ description: "Enemy name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Enemy HP" })
  @IsNumber()
  hp: number;

  @ApiPropertyOptional({ description: "Attack bonus (optional)" })
  @IsOptional()
  @IsNumber()
  attack_bonus?: number;

  @ApiPropertyOptional({ description: "Damage dice (optional)" })
  @IsOptional()
  @IsString()
  damage_dice?: string;

  @ApiPropertyOptional({ description: "Damage bonus (optional)" })
  @IsOptional()
  @IsNumber()
  damage_bonus?: number;
}
