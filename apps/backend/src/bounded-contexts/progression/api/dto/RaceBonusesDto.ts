import { ApiProperty } from "@nestjs/swagger";

export class RaceBonusesDto {
  @ApiProperty({ description: "Vigor bonus", example: 1, required: false })
  vigor?: number;

  @ApiProperty({ description: "Finesse bonus", example: 0, required: false })
  finesse?: number;

  @ApiProperty({ description: "Mind bonus", example: 0, required: false })
  mind?: number;

  @ApiProperty({ description: "Survival bonus", example: 1, required: false })
  survival?: number;
}
