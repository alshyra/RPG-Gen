import { ApiProperty } from "@nestjs/swagger";

/**
 * Response from avatar generation
 */
export class AvatarResponseDto {
  @ApiProperty({ description: "Generated avatar image URL or base64 data" })
  imageUrl: string;
}
