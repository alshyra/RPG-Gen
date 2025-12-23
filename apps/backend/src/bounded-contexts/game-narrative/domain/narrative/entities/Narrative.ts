import { Message } from '../value-objects/Message.js';
import { Context } from '../value-objects/Context.js';

/**
 * Narrative aggregate root
 * 
 * Represents a narrative session with messages and context
 * Associated with a specific character and user
 * Contains both the conversation history and narrative context in one unified entity
 * 
 * @domain game-narrative
 */
export class Narrative {
  readonly userId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly messages: ReadonlyArray<Message>;
  readonly context: Context;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    userId: string;
    characterId: string;
    sessionId: string;
    context: Context;
    messages?: Message[];
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    if (!props.userId) {
      throw new Error('User ID is required');
    }
    if (!props.characterId) {
      throw new Error('Character ID is required');
    }
    if (!props.sessionId) {
      throw new Error('Session ID is required');
    }
    if (!props.context) {
      throw new Error('Context is required');
    }

    this.userId = props.userId;
    this.characterId = props.characterId;
    this.sessionId = props.sessionId;
    this.context = props.context;
    this.messages = props.messages ?? [];
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Add a message to the narrative
   */
  addMessage(message: Message): Narrative {
    return new Narrative({
      userId: this.userId,
      characterId: this.characterId,
      sessionId: this.sessionId,
      context: this.context,
      messages: [...this.messages, message],
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Update the narrative context
   */
  updateContext(newContext: Context): Narrative {
    return new Narrative({
      userId: this.userId,
      characterId: this.characterId,
      sessionId: this.sessionId,
      context: newContext,
      messages: this.messages,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Get the last N messages
   */
  getRecentMessages(count: number = 10): Message[] {
    const start = Math.max(0, this.messages.length - count);
    return this.messages.slice(start);
  }

  /**
   * Get total message count
   */
  getMessageCount(): number {
    return this.messages.length;
  }

  /**
   * Check if narrative is at message limit
   */
  isAtLimit(limit: number = 60): boolean {
    return this.messages.length >= limit;
  }

  /**
   * Get all instructions across all messages
   */
  getAllInstructions(): ReadonlyArray<any> {
    return this.messages.flatMap(msg => msg.instructions);
  }

  /**
   * Get instructions of specific type
   */
  getInstructionsByType(type: string): ReadonlyArray<any> {
    return this.getAllInstructions().filter(instr => instr.type === type);
  }

  /**
   * Build full context for narrative generation
   */
  getFullContext(): string {
    return this.context.getFullContext();
  }
}
