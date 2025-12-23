import { ApiProperty } from "@nestjs/swagger";

export class TalentRankDto {
  @ApiProperty({ description: "Rank number (1-5)", example: 1 })
  rank: number;

  @ApiProperty({ description: "Aptitude ID to unlock at this rank", example: "frappe_puissante" })
  aptitudeId: string;

  @ApiProperty({ description: "Talent points cost to unlock this rank", example: 1 })
  pointCost: number;
}
