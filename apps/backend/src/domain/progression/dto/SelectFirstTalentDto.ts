/**
 * Request DTO for selecting first talent during character creation
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

export class SelectFirstTalentDto {
  @ApiProperty({
    description: "Name of the talent voie (path) to select",
    example: "Voie du guerrier sacré",
  })
  @IsString()
  voieName!: string;

  @ApiProperty({
    description: "Stat to receive +1 bonus",
    enum: ["vigor", "finesse", "mind", "survival"],
    example: "vigor",
  })
  @IsString()
  @IsIn(["vigor", "finesse", "mind", "survival"])
  statBonus: "vigor" | "finesse" | "mind" | "survival";
}
