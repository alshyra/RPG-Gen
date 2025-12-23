import { ApiProperty } from "@nestjs/swagger";
import { BaseStatsDto } from "./BaseClassDto.js";


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
