import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional } from "class-validator";
import { StatAttribute } from "./StatAttribute.js";

export class AptitudeScalingDto {
  @ApiPropertyOptional({ description: "Stat used for scaling (vigor, finesse, mind, survival)" })
  @IsOptional()
  @IsString()
  attribute?: StatAttribute;

  @ApiProperty({ description: "Scaling divisor (e.g., 5 = +1 every 5 levels)" })
  @IsNumber()
  scalingDivisor: number = 5;
}
