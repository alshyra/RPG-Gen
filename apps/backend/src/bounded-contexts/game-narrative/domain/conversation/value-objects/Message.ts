import type { GameInstructionDto } from '../../instruction/GameInstructionDto.js';

export type MessageRole = 'user' | 'assistant';

/**
 * Message value object
 * Represents a single message in a conversation
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

  /**
   * Check if message has any instructions
   */
  hasInstructions(): boolean {
    return this.instructions.length > 0;
  }

  /**
   * Get instructions of a specific type
   */
  getInstructionsByType(type: string): GameInstructionDto[] {
    return this.instructions.filter(instr => instr.type === type) as GameInstructionDto[];
  }
}
