import { ApiProperty } from "@nestjs/swagger";
import { CharacterStatsDto } from "./CharacterStatsDto.js";
import { ClassBaseStatsDto } from "./ClassBaseStatsDto.js";

export class ClassMetadataDto {
  @ApiProperty({ description: "Class ID", example: "guerrier" })
  id: string;

  @ApiProperty({ description: "Internal class name", example: "guerrier" })
  name: string;

  @ApiProperty({ description: "Display name for UI", example: "Guerrier" })
  displayName: string;

  @ApiProperty({ 
    description: "Class description", 
    example: "Maître du combat rapproché, le Guerrier excelle en défense et en puissance brute." 
  })
  description: string;

  @ApiProperty({ description: "Base stats for the class", type: ClassBaseStatsDto })
  baseStats: ClassBaseStatsDto;

  @ApiProperty({ description: "Color for UI (hex)", example: "#dc2626" })
  color: string;

  @ApiProperty({ description: "Icon emoji", example: "⚔️" })
  icon: string;
}
