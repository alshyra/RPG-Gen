import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Character stats using the new simplified system
 * Replaces D&D ability scores (Str, Dex, Con, Int, Wis, Cha)
 *
 * VIG (Vigueur) - Force physique, endurance et robustesse
 * FIN (Finesse) - Agilité, précision et rapidité d'exécution
 * ESP (Esprit) - Intelligence, charisme et force mentale
 * SUR (Survie) - Instinct, perception et connaissance du milieu
 */
export class StatsResponseDto {
  @ApiPropertyOptional({ description: "Vigueur - Physical strength, stamina, and toughness" })
  vigor?: number;

  @ApiPropertyOptional({ description: "Finesse - Agility, precision, and speed" })
  finesse?: number;

  @ApiPropertyOptional({ description: "Esprit - Intelligence, charisma, and mental power" })
  mind?: number;

  @ApiPropertyOptional({ description: "Survie - Instinct, perception, and survival knowledge" })
  survival?: number;
}
