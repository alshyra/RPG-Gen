import { ApiProperty } from "@nestjs/swagger";

export class CharacterStatsDto {
  @ApiProperty({ description: "Vigor stat", example: 3 })
  vigor: number;

  @ApiProperty({ description: "Finesse stat", example: 1 })
  finesse: number;

  @ApiProperty({ description: "Mind stat", example: 0 })
  mind: number;

  @ApiProperty({ description: "Survival stat", example: 2 })
  survival: number;
}
