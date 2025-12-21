import { ApiProperty } from "@nestjs/swagger";

export class TraitEffectDto {
  @ApiProperty({ description: "Type of effect", example: "PA_BONUS" })
  type: string;

  @ApiProperty({ description: "Numeric value of the effect", example: 1 })
  value: number;

  @ApiProperty({ description: "Optional condition for the effect", example: "turn_1", required: false })
  condition?: string;

  @ApiProperty({ description: "Optional sub-type (e.g., physical)", required: false })
  subType?: string;
}
