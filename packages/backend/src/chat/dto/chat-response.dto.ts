import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Chat request body
 */
export class ChatRequestDto {
  @ApiProperty({ description: 'User message to send to the AI' })
  message: string;
}

/**
 * Message metadata
 */
export class MessageMetaDto {
  @ApiPropertyOptional({ description: 'AI model version used' })
  model?: string;

  @ApiPropertyOptional({ description: 'Token usage statistics', additionalProperties: true })
  usage?: Record<string, unknown>;
}

/**
 * Roll instruction data
 */
export class RollInstructionDto {
  @ApiProperty({ description: 'Dice expression (e.g., 1d20+5)' })
  dices: string;

  @ApiPropertyOptional({ description: 'Modifier' })
  modifier?: string | number;

  @ApiPropertyOptional({ description: 'Roll description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Advantage type', enum: [
    'advantage', 'disadvantage', 'none',
  ] })
  advantage?: 'advantage' | 'disadvantage' | 'none';
}

/**
 * Spell instruction data
 */
export class SpellInstructionDataDto {
  @ApiProperty({ description: 'Spell action', enum: [
    'learn', 'cast', 'forget',
  ] })
  action: 'learn' | 'cast' | 'forget';

  @ApiProperty({ description: 'Spell name' })
  name: string;

  @ApiPropertyOptional({ description: 'Spell level' })
  level?: number;

  @ApiPropertyOptional({ description: 'Spell school' })
  school?: string;

  @ApiPropertyOptional({ description: 'Spell description' })
  description?: string;
}

/**
 * Inventory instruction data
 */
export class InventoryInstructionDataDto {
  @ApiProperty({ description: 'Inventory action', enum: [
    'add', 'remove', 'use',
  ] })
  action: 'add' | 'remove' | 'use';

  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Item description' })
  description?: string;
}

/**
 * Game instruction from the AI
 */
export class GameInstructionDto {
  @ApiPropertyOptional({ description: 'Instruction type', enum: [
    'roll', 'xp', 'hp', 'spell', 'inventory',
  ] })
  type?: string;

  @ApiPropertyOptional({ description: 'Roll instruction data', type: RollInstructionDto })
  roll?: RollInstructionDto;

  @ApiPropertyOptional({ description: 'HP change' })
  hp?: number;

  @ApiPropertyOptional({ description: 'XP gained' })
  xp?: number;

  @ApiPropertyOptional({ description: 'Spell instruction', type: SpellInstructionDataDto })
  spell?: SpellInstructionDataDto;

  @ApiPropertyOptional({ description: 'Inventory instruction', type: InventoryInstructionDataDto })
  inventory?: InventoryInstructionDataDto;
}

/**
 * Chat response
 */
export class ChatResponseDto {
  @ApiProperty({ description: 'Narrative text from the AI (cleaned)' })
  text: string;

  @ApiProperty({ description: 'Game instructions extracted from the response', type: [GameInstructionDto] })
  instructions: GameInstructionDto[];

  @ApiProperty({ description: 'AI model used' })
  model: string;

  @ApiPropertyOptional({ description: 'Token usage statistics', additionalProperties: true })
  usage?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Raw response (null by default)' })
  raw?: unknown;
}

/**
 * Chat message in history
 */
export class ChatMessageDto {
  @ApiProperty({ description: 'Message role', enum: [
    'user', 'assistant', 'system',
  ] })
  role: string;

  @ApiProperty({ description: 'Message text content' })
  text: string;

  @ApiProperty({ description: 'Unix timestamp of the message' })
  timestamp: number;

  @ApiPropertyOptional({ description: 'Message metadata', type: MessageMetaDto })
  meta?: MessageMetaDto;

  @ApiPropertyOptional({ description: 'Narrative text (for assistant messages)' })
  narrative?: string;

  @ApiPropertyOptional({ description: 'Game instructions (for assistant messages)', type: [GameInstructionDto] })
  instructions?: GameInstructionDto[];
}
