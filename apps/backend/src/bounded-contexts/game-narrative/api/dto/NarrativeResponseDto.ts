import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  InventoryInstructionMessageDto,
  CombatStartInstructionMessageDto,
  type GameInstructionDto,
} from './response/GameInstructionDto.js';

/**
 * Response DTO for narrative chat operations
 */
@ApiExtraModels(
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  InventoryInstructionMessageDto,
  CombatStartInstructionMessageDto,
)
export class NarrativeResponseDto {
  @ApiProperty({
    description: 'Message role (user or assistant)',
    enum: ['user', 'assistant'],
  })
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Narrative content' })
  narrative: string;

  @ApiPropertyOptional({
    description: 'Game instructions',
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(RollInstructionMessageDto) },
        { $ref: getSchemaPath(HpInstructionMessageDto) },
        { $ref: getSchemaPath(XpInstructionMessageDto) },
        { $ref: getSchemaPath(InventoryInstructionMessageDto) },
        { $ref: getSchemaPath(CombatStartInstructionMessageDto) },
      ],
    },
  })
  instructions?: GameInstructionDto[];

  constructor(partial: Partial<NarrativeResponseDto>) {
    Object.assign(this, partial);
  }
}
