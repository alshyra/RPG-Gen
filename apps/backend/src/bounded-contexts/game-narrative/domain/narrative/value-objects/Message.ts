import type { GameInstructionDto } from '../../../api/dto/response/GameInstructionDto.js';

export type MessageRole = 'user' | 'assistant';

/**
 * Message value object
 * Represents a single message in the narrative
 */
export class Message {
  readonly role: MessageRole;
  readonly narrative: string;
  readonly instructions: ReadonlyArray<GameInstructionDto>;
  readonly timestamp: Date;

  constructor(props: {
    role: MessageRole;
    narrative: string;
    instructions?: GameInstructionDto[];
    timestamp?: Date;
  }) {
    if (!props.narrative || props.narrative.trim().length === 0) {
      throw new Error('Message narrative cannot be empty');
    }

    this.role = props.role;
    this.narrative = props.narrative;
    this.instructions = props.instructions ?? [];
    this.timestamp = props.timestamp ?? new Date();
  }

  hasInstructions(): boolean {
    return this.instructions.length > 0;
  }

  getInstructionsByType(type: string): GameInstructionDto[] {
    return this.instructions.filter(instr => instr.type === type);
  }
}
