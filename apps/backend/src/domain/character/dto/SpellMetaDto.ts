import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class SpellMetaDto {
  @ApiPropertyOptional({ description: 'Damage dice notation (e.g., "1d6")' })
  @IsOptional()
  @IsString()
  damageDice?: string;

  @ApiPropertyOptional({ description: "Type of damage (fire, cold, etc.)" })
  @IsOptional()
  @IsString()
  damageType?: string;

  @ApiPropertyOptional({ description: "Saving throw type (DEX, CON, etc.)" })
  @IsOptional()
  @IsString()
  saveType?: string;

  @ApiPropertyOptional({
    description: "Attack type",
    enum: ["melee", "ranged", "spell"],
  })
  @IsOptional()
  @IsString()
  attackType?: "melee" | "ranged" | "spell";

  @ApiPropertyOptional({ description: "School of magic" })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiPropertyOptional({ description: "Area of effect description" })
  @IsOptional()
  @IsString()
  areaOfEffect?: string;

  @ApiPropertyOptional({ description: "Scaling description" })
  @IsOptional()
  @IsString()
  scaling?: string;

  // Allow additional properties for extensibility
  [key: string]: unknown;
}
