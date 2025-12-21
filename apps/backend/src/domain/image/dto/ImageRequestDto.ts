import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Request body for image generation
 */
export class ImageRequestDto {
  @ApiPropertyOptional({ description: "API token (optional)" })
  token?: string;

  @ApiProperty({ description: "Image prompt" })
  prompt: string;

  @ApiPropertyOptional({ description: "Model to use" })
  model?: string;
}
