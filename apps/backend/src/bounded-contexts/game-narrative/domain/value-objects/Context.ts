/**
 * Character context data value object
 * Encapsulates character state and configuration
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
 * Context value object
 * Stores the context required for narrative generation
 * Includes character state, system prompt, and scenario
 * 
 * @domain game-narrative
 */
export class Context {
  readonly characterContext: CharacterContextData;
  readonly systemPrompt: string;
  readonly scenarioPrompt: string;

  constructor(props: {
    characterContext: CharacterContextData;
    systemPrompt: string;
    scenarioPrompt: string;
  }) {
    if (!props.characterContext) {
      throw new Error('Character context is required');
    }

    this.characterContext = props.characterContext;
    this.systemPrompt = props.systemPrompt;
    this.scenarioPrompt = props.scenarioPrompt;
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
  updateCharacterContext(newContext: Partial<CharacterContextData>): Context {
    return new Context({
      characterContext: { ...this.characterContext, ...newContext },
      systemPrompt: this.systemPrompt,
      scenarioPrompt: this.scenarioPrompt,
    });
  }
}
