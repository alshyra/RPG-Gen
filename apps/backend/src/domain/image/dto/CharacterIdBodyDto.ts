import { ApiProperty } from "@nestjs/swagger";

/**
 * Request body for avatar generation
 */
export class CharacterIdBodyDto {
  @ApiProperty({ description: "UUID of the character" })
  characterId: string;
}
