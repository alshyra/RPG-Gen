import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Instruction DTO
 */
export class InstructionResponseDto {
  @ApiProperty({ description: 'Instruction type', example: 'roll' })
  type: string;

  @ApiPropertyOptional({ description: 'Instruction data' })
  data?: Record<string, any>;
}

/**
 * Message response DTO
 */
export class MessageResponseDto {
  @ApiProperty({ description: 'Message role', enum: ['user', 'assistant'], example: 'assistant' })
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Message narrative text' })
  narrative: string;

  @ApiPropertyOptional({ description: 'Associated instructions', type: [InstructionResponseDto] })
  instructions?: InstructionResponseDto[];

  @ApiProperty({ description: 'Message timestamp' })
  timestamp: string;
}

/**
 * Conversation response DTO
 */
export class ConversationResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Character ID' })
  characterId: string;

  @ApiProperty({ description: 'Message count' })
  messageCount: number;

  @ApiProperty({ description: 'Messages', type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}

/**
 * Chat message request DTO (for sending messages)
 */
export class ChatMessageRequestDto {
  @ApiProperty({ description: 'Message text from user', example: 'I want to attack the goblin' })
  message: string;

  @ApiPropertyOptional({ description: 'Optional action context', example: 'combat' })
  context?: string;
}

/**
 * Chat response DTO (AI narrative response)
 */
export class ChatResponseDto {
  @ApiProperty({ description: 'Narrative response from AI' })
  narrative: string;

  @ApiPropertyOptional({ description: 'Game instructions to apply', type: [InstructionResponseDto] })
  instructions?: InstructionResponseDto[];

  @ApiProperty({ description: 'Updated conversation', type: ConversationResponseDto })
  conversation: ConversationResponseDto;
}
