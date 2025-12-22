import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CombatStartEntryDto } from "./CombatStartEntryDto.js";

export class CombatStartRequestDto {
  @ApiProperty({
    description: "Array of enemies to initialize combat with",
    type: [CombatStartEntryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombatStartEntryDto)
  combat_start: CombatStartEntryDto[];
}
