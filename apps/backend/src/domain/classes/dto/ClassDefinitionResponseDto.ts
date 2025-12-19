import { ApiProperty } from "@nestjs/swagger";

class BaseStatsDto {
  @ApiProperty({ description: "Base HP", example: 12 })
  hp_base: number;

  @ApiProperty({ description: "Base PA (action points)", example: 6 })
  pa: number;

  @ApiProperty({ description: "Base PM (movement points)", example: 4 })
  pm: number;
}

export class ClassDefinitionResponseDto {
  @ApiProperty({ description: "Class name", example: "guerrier" })
  name: string;

  @ApiProperty({ description: "Base stats for this class", type: BaseStatsDto })
  baseStats: BaseStatsDto;

  @ApiProperty({ description: "Proficiencies (finesse, vigueur, etc.)", type: [String], example: ["vigueur", "finesse"] })
  proficiencies?: string[];

  @ApiProperty({ description: "Starting aptitude IDs", type: [String], example: ["frappe_simple", "posture_defensive"] })
  startingAptitudes?: string[];
}
