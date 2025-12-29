import { ApiProperty } from "@nestjs/swagger";

/**
 * Request body for avatar generation
 */
export class GenerateAvatarRequestDto {
  @ApiProperty({ description: "UUID of the character" })
  characterId: string;
}
