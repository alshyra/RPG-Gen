import { ApiPropertyOptional } from '@nestjs/swagger';
import { CombatStartEntryDto, CombatEndDto } from '../../combat/dto/index.js';
import { InventoryInstructionDto } from './InventoryInstructionDto.js';
import { RollInstructionDto } from './RollInstructionDto.js';
import { SpellInstructionDto } from './SpellInstructionDto.js';

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

  @ApiPropertyOptional({ description: 'Spell instruction', type: SpellInstructionDto })
  spell?: SpellInstructionDto;

  @ApiPropertyOptional({ description: 'Inventory instruction', type: InventoryInstructionDto })
  inventory?: InventoryInstructionDto;

  @ApiPropertyOptional({ description: 'Combat start entries', type: [CombatStartEntryDto] })
  combat_start?: CombatStartEntryDto[];

  @ApiPropertyOptional({ description: 'Combat end result', type: CombatEndDto })
  combat_end?: CombatEndDto;
}
