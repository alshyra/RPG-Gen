import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber } from "class-validator";

export class TalentRankDto {
  @ApiProperty({ description: "Rank number (1-5)", example: 1 })
  @IsNumber()
  rank: number;

  @ApiProperty({ description: "Aptitude ID to unlock at this rank", example: "frappe_puissante" })
  @IsString()
  aptitudeId: string;

  @ApiProperty({ description: "Talent points cost to unlock this rank", example: 1 })
  @IsNumber()
  pointCost: number;
}
