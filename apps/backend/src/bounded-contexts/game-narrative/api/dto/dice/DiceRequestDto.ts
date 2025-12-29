import { IsString } from "class-validator";
import { type AdvantageType } from "./dice-types.js";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DiceRequestDto {
  @ApiProperty()
  @IsString()
  expr: string;

  @ApiPropertyOptional()
  @IsString()
  advantage?: AdvantageType;
}
