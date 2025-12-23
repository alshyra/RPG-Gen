import { ApiProperty } from "@nestjs/swagger";

export class SelectClassDto {
  @ApiProperty({ 
    description: "Class name to select",
    example: "guerrier",
    enum: ["guerrier", "rogue", "mage"]
  })
  className: string;
}
