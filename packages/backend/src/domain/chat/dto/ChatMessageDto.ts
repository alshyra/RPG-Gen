import {
  ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath,
} from '@nestjs/swagger';
import {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  SpellInstructionMessageDto,
  InventoryInstructionMessageDto,
  GameInstructionDto,
  CombatEndInstructionMessageDto,
  CombatStartInstructionMessageDto,
} from './GameInstructionDto.js';
import { IsArray, IsString } from 'class-validator';

@ApiExtraModels(
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  SpellInstructionMessageDto,
  InventoryInstructionMessageDto,
  CombatEndInstructionMessageDto,
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
  @IsString()
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({ description: 'Narrative text (for assistant messages)' })
  @IsString()
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
  @IsArray()
  instructions?: GameInstructionDto[];
}
