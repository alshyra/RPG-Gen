import { ApiProperty } from "@nestjs/swagger";
import { CharacterStatsDto } from "./CharacterStatsDto.js";

export class ClassBaseStatsDto {
  @ApiProperty({ description: "Base HP", example: 12 })
  hp: number;

  @ApiProperty({ description: "Base PA (action points)", example: 6 })
  pa: number;

  @ApiProperty({ description: "Base PM (movement points)", example: 4 })
  pm: number;

  @ApiProperty({ description: "Base character stats", type: CharacterStatsDto })
  stats: CharacterStatsDto;
}
