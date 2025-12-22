import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber } from "class-validator";

/**
 * DTO for dice roll results
 */
export class DiceResultDto {
  @ApiProperty({ description: "Individual dice roll results", type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  rolls: number[];

  @ApiProperty({ description: "Modifier applied to the total" })
  @IsNumber()
  modifierValue: number;

  @ApiProperty({ description: "Total result (sum of rolls + modifier)" })
  @IsNumber()
  total: number;
}
