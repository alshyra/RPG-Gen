import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

/**
 * Tactical system stats (Vigor, Finesse, Mind, Survival)
 */
export class TacticalStats {
  @ApiProperty({ description: "Vigor stat" })
  @IsNumber()
  vigor: number;

  @ApiProperty({ description: "Finesse stat" })
  @IsNumber()
  finesse: number;

  @ApiProperty({ description: "Mind stat" })
  @IsNumber()
  mind: number;

  @ApiProperty({ description: "Survival stat" })
  @IsNumber()
  survival: number;
}
