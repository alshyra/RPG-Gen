import {
  ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath,
} from '@nestjs/swagger';
import {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  SpellInstructionMessageDto,
  InventoryInstructionMessageDto,
  CombatStartInstructionMessageDto,
  GameInstructionDto,
} from './GameInstructionDto.js';

@ApiExtraModels(
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  SpellInstructionMessageDto,
  InventoryInstructionMessageDto,
  CombatStartInstructionMessageDto,
)
export class ChatMessageDto {
  @ApiProperty({
    description: 'Message role',
    enum: [
      'user',
      'assistant',
      'system',
    ],
  })
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({ description: 'Narrative text (for assistant messages)' })
  narrative: string;

  @ApiPropertyOptional({
    description: 'Game instructions (for assistant messages)',
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(RollInstructionMessageDto) },
        { $ref: getSchemaPath(HpInstructionMessageDto) },
        { $ref: getSchemaPath(XpInstructionMessageDto) },
        { $ref: getSchemaPath(SpellInstructionMessageDto) },
        { $ref: getSchemaPath(InventoryInstructionMessageDto) },
        { $ref: getSchemaPath(CombatStartInstructionMessageDto) },
        // combat end is handled by the API response shape (CombatEndResponseDto) and not an AI instruction
      ],
    },
  })
  instructions?: GameInstructionDto[];
}
