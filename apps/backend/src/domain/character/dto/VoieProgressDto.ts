import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsArray } from "class-validator";

export class VoieProgressDto {
  @ApiProperty({ description: "Talent tree ID" })
  @IsString()
  voieId: string;

  @ApiProperty({ description: "Talent tree display name (e.g., 'Voie de l'Ombre')" })
  @IsString()
  voieName: string;

  @ApiProperty({ description: "Parent class name (guerrier, rogue, mage)" })
  @IsString()
  className: string;

  @ApiProperty({ description: "Current rank unlocked (0-5, where 0 = not started)" })
  @IsNumber()
  currentRank: number;

  @ApiPropertyOptional({ description: "Talent points required to unlock next rank" })
  @IsNumber()
  requiredTalentPoints?: number;

  @ApiPropertyOptional({ description: "IDs of aptitudes unlocked in this voie" })
  @IsArray()
  @IsString({ each: true })
  unlockedAptitudes?: string[];
}
