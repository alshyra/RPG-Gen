import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SelectRaceDto {
  @ApiProperty({
    description: "Race ID to select",
    example: "humain"
  })
  @IsString()
  raceId: string;
}
