import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, Min, Max } from "class-validator";

export class UnlockRankDto {
  @ApiProperty({ description: "Talent tree ID to unlock a rank in" })
  @IsString()
  voieId: string;

  @ApiProperty({ description: "Target rank to unlock (1-5)" })
  @IsNumber()
  @Min(1)
  @Max(5)
  targetRank: number;
}
