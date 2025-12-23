import { Message } from '../value-objects/Message.js';

/**
 * Conversation aggregate root
 * 
 * Represents a conversation between a user and the narrative AI
 * Associated with a specific character and user
 * 
 * @domain game-narrative
 */
export class Conversation {
  readonly userId: string;
  readonly characterId: string;
  readonly messages: ReadonlyArray<Message>;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    userId: string;
    characterId: string;
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

    this.userId = props.userId;
    this.characterId = props.characterId;
    this.messages = props.messages ?? [];
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Add a message to the conversation
   */
  addMessage(message: Message): Conversation {
    return new Conversation({
      userId: this.userId,
      characterId: this.characterId,
      messages: [...this.messages, message],
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
   * Check if conversation is at message limit
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
}
