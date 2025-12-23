import { ApiProperty } from "@nestjs/swagger";

export class UnlockRankDto {
  @ApiProperty({ 
    description: "Talent tree (voie) ID",
    example: "voie_guerrier_defense"
  })
  voieId: string;
  
  @ApiProperty({ 
    description: "Rank to unlock (1-5)",
    example: 1,
    minimum: 1,
    maximum: 5
  })
  rank: number;
}
