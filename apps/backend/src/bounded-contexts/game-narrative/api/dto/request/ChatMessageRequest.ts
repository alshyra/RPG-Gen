import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Request DTO for sending a chat message
 */
export class ChatMessageRequestDto {
  @ApiProperty({
    description: 'Message text from user',
    example: 'I want to attack the goblin',
  })
  @IsString()
  message: string;
}