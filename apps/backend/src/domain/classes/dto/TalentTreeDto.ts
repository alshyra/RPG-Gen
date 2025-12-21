import { ApiProperty } from "@nestjs/swagger";
import { TalentRankDto } from "./TalentRankDto.js";

export class TalentTreeDto {
  @ApiProperty({ description: "Talent tree (voie) ID", example: "voie_guerrier_defense" })
  id: string;

  @ApiProperty({ description: "Talent tree name", example: "Voie de la Défense" })
  name: string;

  @ApiProperty({ description: "Ranks in this talent tree", type: [TalentRankDto] })
  ranks: TalentRankDto[];
}
