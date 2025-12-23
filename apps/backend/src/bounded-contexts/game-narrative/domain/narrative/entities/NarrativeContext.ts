/**
 * NarrativeContext value object
 * Encapsulates context information for narrative generation
 */
export interface CharacterContextData {
  name: string;
  race: string;
  className: string;
  level: number;
  gender?: string;
  stats?: {
    vigor: number;
    finesse: number;
    mind: number;
    survival: number;
  };
  currentHp?: number;
  maxHp?: number;
  inventory?: Array<{
    name: string;
    quantity: number;
  }>;
}

/**
 * NarrativeContext aggregate root
 * Stores the context required for narrative generation
 * Includes character state, system prompt, and scenario
 * 
 * @domain game-narrative
 */
export class NarrativeContext {
  readonly characterContext: CharacterContextData;
  readonly systemPrompt: string;
  readonly scenarioPrompt: string;
  readonly sessionId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    sessionId: string;
    characterContext: CharacterContextData;
    systemPrompt: string;
    scenarioPrompt: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    if (!props.sessionId) {
      throw new Error('Session ID is required');
    }
    if (!props.characterContext) {
      throw new Error('Character context is required');
    }

    this.sessionId = props.sessionId;
    this.characterContext = props.characterContext;
    this.systemPrompt = props.systemPrompt;
    this.scenarioPrompt = props.scenarioPrompt;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Build character summary for the narrative engine
   */
  buildCharacterSummary(): string {
    const stats = this.characterContext.stats ?? { vigor: 0, finesse: 0, mind: 0, survival: 0 };
    const hp = this.characterContext.currentHp ?? this.characterContext.maxHp ?? 0;

    let summary = `
Character Information:
- Name: ${this.characterContext.name || 'Unknown'}
- Race: ${this.characterContext.race || 'Unknown'}
- Class: ${this.characterContext.className || 'Unknown'}
- Level: ${this.characterContext.level || 1}
- Gender: ${this.characterContext.gender || 'Unknown'}

Stats:
- Vigor: ${stats.vigor}
- Finesse: ${stats.finesse}
- Mind: ${stats.mind}
- Survival: ${stats.survival}

Health: ${hp}/${this.characterContext.maxHp || 'Unknown'}`;

    if (this.characterContext.inventory && this.characterContext.inventory.length > 0) {
      summary += '\n\nInventory:';
      this.characterContext.inventory.forEach(item => {
        summary += `\n- ${item.name} (x${item.quantity})`;
      });
    }

    return summary;
  }

  /**
   * Get full context for narrative generation
   */
  getFullContext(): string {
    return `${this.systemPrompt}\n\n${this.scenarioPrompt}\n\n${this.buildCharacterSummary()}`;
  }

  /**
   * Update character context
   */
  updateCharacterContext(newContext: Partial<CharacterContextData>): NarrativeContext {
    return new NarrativeContext({
      sessionId: this.sessionId,
      characterContext: { ...this.characterContext, ...newContext },
      systemPrompt: this.systemPrompt,
      scenarioPrompt: this.scenarioPrompt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Getter methods for accessing properties
   */
  getSessionId(): string {
    return this.sessionId;
  }

  getCharacterContext(): CharacterContextData {
    return this.characterContext;
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  getScenarioPrompt(): string {
    return this.scenarioPrompt;
  }
}
