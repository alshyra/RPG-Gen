import { ApiProperty } from "@nestjs/swagger";

export class SelectRaceDto {
  @ApiProperty({ 
    description: "Race ID to select",
    example: "humain"
  })
  raceId: string;
}
