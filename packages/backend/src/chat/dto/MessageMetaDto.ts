import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Message metadata
 */
export class MessageMetaDto {
  @ApiPropertyOptional({ description: 'AI model version used' })
  model?: string;

  @ApiPropertyOptional({ description: 'Token usage statistics', additionalProperties: true })
  usage?: Record<string, unknown>;
}
