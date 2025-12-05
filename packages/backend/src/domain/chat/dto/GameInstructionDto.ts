export * from './RollInstructionMessageDto.js';
export * from './HpInstructionMessageDto.js';
export * from './XpInstructionMessageDto.js';
export * from './SpellInstructionMessageDto.js';
export * from './InventoryInstructionMessageDto.js';
export * from './CombatEndInstructionMessageDto.js';

import type { RollInstructionMessageDto } from './RollInstructionMessageDto.js';
import type { HpInstructionMessageDto } from './HpInstructionMessageDto.js';
import type { XpInstructionMessageDto } from './XpInstructionMessageDto.js';
import type { SpellInstructionMessageDto } from './SpellInstructionMessageDto.js';
import type { InventoryInstructionMessageDto } from './InventoryInstructionMessageDto.js';
// Combat end is handled by dedicated end-combat DTOs/responses — not as an AI instruction
import type { CombatEndInstructionMessageDto } from './CombatEndInstructionMessageDto.js';

export type GameInstructionDto
  = | RollInstructionMessageDto
    | HpInstructionMessageDto
    | XpInstructionMessageDto
    | SpellInstructionMessageDto
    | InventoryInstructionMessageDto
    | CombatEndInstructionMessageDto;
