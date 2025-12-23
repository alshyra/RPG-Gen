import { ApiProperty } from "@nestjs/swagger";

export class BaseStatsDto {
  @ApiProperty({ description: "Base HP", example: 12 })
  hp_base: number;

  @ApiProperty({ description: "Base PA (action points)", example: 6 })
  pa: number;

  @ApiProperty({ description: "Base PM (movement points)", example: 4 })
  pm: number;
}
