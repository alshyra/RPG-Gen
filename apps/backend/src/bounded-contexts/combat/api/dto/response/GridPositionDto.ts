import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class GridPositionDto {
  @ApiProperty({ description: "X coordinate on combat grid" })
  @IsNumber()
  x: number;

  @ApiProperty({ description: "Y coordinate on combat grid" })
  @IsNumber()
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
