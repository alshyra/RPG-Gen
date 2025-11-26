// GENERATED FROM backend - do not edit manually

import { RollInstructionDto } from './rollinstruction.dto';
import { SpellInstructionDataDto } from './spellinstructiondata.dto';
import { InventoryInstructionDataDto } from './inventoryinstructiondata.dto';

export interface GameInstructionDto {
  type?: string;
  roll?: RollInstructionDto;
  hp?: number;
  xp?: number;
  spell?: SpellInstructionDataDto;
  inventory?: InventoryInstructionDataDto;
}
