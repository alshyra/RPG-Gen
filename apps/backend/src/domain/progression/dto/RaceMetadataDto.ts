import { ApiProperty } from "@nestjs/swagger";

class RaceBonusesDto {
  @ApiProperty({ description: "Vigor bonus", example: 1, required: false })
  vigor?: number;

  @ApiProperty({ description: "Finesse bonus", example: 0, required: false })
  finesse?: number;

  @ApiProperty({ description: "Mind bonus", example: 0, required: false })
  mind?: number;

  @ApiProperty({ description: "Survival bonus", example: 1, required: false })
  survival?: number;
}

class TraitEffectDto {
  @ApiProperty({ description: "Type of effect", example: "PA_BONUS" })
  type: string;

  @ApiProperty({ description: "Numeric value of the effect", example: 1 })
  value: number;

  @ApiProperty({ description: "Optional condition for the effect", example: "turn_1", required: false })
  condition?: string;

  @ApiProperty({ description: "Optional sub-type (e.g., physical)", required: false })
  subType?: string;
}

export class RaceMetadataDto {
  @ApiProperty({ description: "Race ID", example: "humain" })
  id: string;

  @ApiProperty({ description: "Race name", example: "Humain" })
  name: string;

  @ApiProperty({ description: "Special trait name", example: "Polyvalent" })
  trait: string;

  @ApiProperty({
    description: "Trait effect (structured)",
    type: TraitEffectDto,
  })
  traitEffect: TraitEffectDto;

  @ApiProperty({ description: "Stat bonuses", type: RaceBonusesDto })
  bonuses: RaceBonusesDto;

  @ApiProperty({ description: "Color for UI (hex)", example: "#3b82f6" })
  color: string;

  @ApiProperty({ description: "Icon emoji", example: "👤" })
  icon: string;
}
