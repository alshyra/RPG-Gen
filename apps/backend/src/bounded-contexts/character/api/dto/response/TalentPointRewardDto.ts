import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class TalentPointRewardDto {
  @ApiProperty({ description: "Character level that was reached" })
  @IsNumber()
  level: number;

  @ApiProperty({ description: "Talent points awarded at this level" })
  @IsNumber()
  talentPointsAwarded: number;

  @ApiProperty({ description: "Human-readable message" })
  @IsString()
  message: string;
}
