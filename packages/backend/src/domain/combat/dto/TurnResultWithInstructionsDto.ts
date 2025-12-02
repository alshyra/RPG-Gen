import { ApiPropertyOptional } from '@nestjs/swagger';
import { TurnResultDto } from './TurnResultDto.js';
import type { GameInstructionDto } from '../../chat/dto/GameInstructionDto.js';
import {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  SpellInstructionMessageDto,
  InventoryInstructionMessageDto,
  CombatStartInstructionMessageDto,
  CombatEndInstructionMessageDto,
} from '../../chat/dto/index.js';

export class TurnResultWithInstructionsDto extends TurnResultDto {
  @ApiPropertyOptional({
    description: 'Optional set of frontend instructions to apply after the turn',
    type: 'array',
    items: {
      oneOf: [
        { $ref: '#/components/schemas/RollInstructionMessageDto' },
        { $ref: '#/components/schemas/HpInstructionMessageDto' },
        { $ref: '#/components/schemas/XpInstructionMessageDto' },
        { $ref: '#/components/schemas/SpellInstructionMessageDto' },
        { $ref: '#/components/schemas/InventoryInstructionMessageDto' },
        { $ref: '#/components/schemas/CombatStartInstructionMessageDto' },
        { $ref: '#/components/schemas/CombatEndInstructionMessageDto' },
      ],
    },
  })
  instructions?: GameInstructionDto[];
}

// Re-export instruction DTOs for OpenAPI schema generation
export {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  SpellInstructionMessageDto,
  InventoryInstructionMessageDto,
  CombatStartInstructionMessageDto,
  CombatEndInstructionMessageDto,
};
