import { ApiProperty } from "@nestjs/swagger";

export class BaseStatsDto {
  @ApiProperty({ description: "Base HP", example: 12 })
  hpBase: number;

  @ApiProperty({ description: "HP gain per level", example: 3 })
  hpGain: number;

  @ApiProperty({ description: "Base PA (action points)", example: 6 })
  pa: number;

  @ApiProperty({ description: "Base PM (movement points)", example: 4 })
  pm: number;
}

