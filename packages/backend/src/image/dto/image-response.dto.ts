import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Request body for avatar generation
 */
export class CharacterIdBodyDto {
  @ApiProperty({ description: 'UUID of the character' })
  characterId: string;
}

/**
 * Response from avatar generation
 */
export class AvatarResponseDto {
  @ApiProperty({ description: 'Generated avatar image URL or base64 data' })
  imageUrl: string;
}

/**
 * Request body for image generation
 */
export class ImageRequestDto {
  @ApiPropertyOptional({ description: 'API token (optional)' })
  token?: string;

  @ApiProperty({ description: 'Image prompt' })
  prompt: string;

  @ApiPropertyOptional({ description: 'Model to use' })
  model?: string;
}
