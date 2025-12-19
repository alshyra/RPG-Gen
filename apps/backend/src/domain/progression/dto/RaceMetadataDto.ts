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

export class RaceMetadataDto {
  @ApiProperty({ description: "Race ID", example: "humain" })
  id: string;

  @ApiProperty({ description: "Race name", example: "Humain" })
  name: string;

  @ApiProperty({ description: "Special trait name", example: "Polyvalent" })
  trait: string;

  @ApiProperty({ 
    description: "Trait effect description", 
    example: "+1 à toutes les compétences" 
  })
  traitEffect: string;

  @ApiProperty({ description: "Stat bonuses", type: RaceBonusesDto })
  bonuses: RaceBonusesDto;

  @ApiProperty({ description: "Color for UI (hex)", example: "#3b82f6" })
  color: string;

  @ApiProperty({ description: "Icon emoji", example: "👤" })
  icon: string;
}
