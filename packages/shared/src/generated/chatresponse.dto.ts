// GENERATED FROM backend - do not edit manually

import { GameInstructionDto } from './gameinstruction.dto';

export interface ChatResponseDto {
  text: string;
  instructions: GameInstructionDto[];
  model: string;
  usage?: Record<string, unknown>;
  raw?: unknown;
}
