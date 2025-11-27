import { ApiProperty } from '@nestjs/swagger';

/**
 * Chat request body
 */
export class ChatRequestDto {
  @ApiProperty({ description: 'User message to send to the AI' })
  message: string;
}
