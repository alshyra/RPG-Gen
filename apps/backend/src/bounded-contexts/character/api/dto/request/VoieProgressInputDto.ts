import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, Min, Max, IsOptional } from "class-validator";

/**
 * Input DTO for voie (talent tree) progress updates.
 * 
 * @description
 * This is a relaxed version of VoieProgressDto for input.
 * Only voieId and currentRank are required - the backend will
 * fill in className, voieName, and ranks from the class definition.
 */
export class VoieProgressInputDto {
  @ApiProperty({ 
    description: "Talent tree ID (e.g., 'rog_ombre', 'gue_protection')",
    example: "rog_ombre"
  })
  @IsString()
  voieId: string;

  @ApiProperty({ 
    description: "Current rank unlocked (1-5)",
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  currentRank: number;

  @ApiPropertyOptional({ 
    description: "Voie name (optional, backend will fill from definition)",
    example: "Voie de l'Ombre"
  })
  @IsOptional()
  @IsString()
  voieName?: string;

  @ApiPropertyOptional({ 
    description: "Class name (optional, backend will fill from character)",
    example: "rogue"
  })
  @IsOptional()
  @IsString()
  className?: string;
}
