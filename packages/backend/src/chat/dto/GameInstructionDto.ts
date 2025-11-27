import { ApiPropertyOptional } from '@nestjs/swagger';
import { RollInstructionDto } from './RollInstructionDto.js';
import { SpellInstructionDataDto } from './SpellInstructionDataDto.js';
import { InventoryInstructionDataDto } from './InventoryInstructionDataDto.js';

/**
 * Game instruction from the AI
 */
export class GameInstructionDto {
  @ApiPropertyOptional({ description: 'Instruction type', enum: [
    'roll',
    'xp',
    'hp',
    'spell',
    'inventory',
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
