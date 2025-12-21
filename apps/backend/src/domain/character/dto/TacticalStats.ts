import { ApiProperty } from "@nestjs/swagger";

/**
 * Tactical system stats (Vigor, Finesse, Mind, Survival)
 */
export class TacticalStats {
  @ApiProperty({ description: "Vigor stat" })
  vigor: number;

  @ApiProperty({ description: "Finesse stat" })
  finesse: number;

  @ApiProperty({ description: "Mind stat" })
  mind: number;

  @ApiProperty({ description: "Survival stat" })
  survival: number;
}
