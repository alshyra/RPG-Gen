import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RaceBonusesDto } from "./RaceBonusesDto.js";
import { TraitEffectDto } from "./TraitEffectDto.js";

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

  @ApiPropertyOptional({ 
    description: "Description for AI usage", 
    example: "Polyvalent, gagne +1 PA au premier tour."
  })
  descriptionForAi?: string;

  @ApiProperty({ description: "Color for UI (hex)", example: "#3b82f6" })
  color: string;

  @ApiProperty({ description: "Icon emoji", example: "👤" })
  icon: string;
}
