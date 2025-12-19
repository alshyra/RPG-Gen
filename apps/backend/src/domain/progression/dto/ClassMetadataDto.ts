import { ApiProperty } from "@nestjs/swagger";

class CharacterStatsDto {
  @ApiProperty({ description: "Vigor stat", example: 3 })
  vigor: number;

  @ApiProperty({ description: "Finesse stat", example: 1 })
  finesse: number;

  @ApiProperty({ description: "Mind stat", example: 0 })
  mind: number;

  @ApiProperty({ description: "Survival stat", example: 2 })
  survival: number;
}

class ClassBaseStatsDto {
  @ApiProperty({ description: "Base HP", example: 12 })
  hp: number;

  @ApiProperty({ description: "Base PA (action points)", example: 6 })
  pa: number;

  @ApiProperty({ description: "Base PM (movement points)", example: 4 })
  pm: number;

  @ApiProperty({ description: "Base character stats", type: CharacterStatsDto })
  stats: CharacterStatsDto;
}

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
