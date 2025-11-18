export type GameInstruction
  = | { type: 'roll'; roll: { dices: string; modifier: string; description: string } }
    | { type: 'xp'; xp: number }
    | { type: 'hp'; hp: number }
    | { type: 'spell'; spell: Record<string, unknown> }
    | { type: 'inventory'; inventory: Record<string, unknown> };

export interface GameMessage {
  role: string;
  text: string;
}

export interface GameResponse {
  text: string;
  instructions: GameInstruction[];
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class GameMessage {
  constructor();

  static fromMessages(narrative: string): GameMessage {
    const jsonBlocks = extractJsonBlocks(narrative);
    const inlineJsons = extractInlineJson(narrative);
    const allJsons = [...jsonBlocks, ...inlineJsons];

    const instructions = allJsons
      .map(this.parseJsonWithNewlines)
      .filter((obj): obj is Record<string, unknown> => obj !== null)
      .filter(isGameInstruction)
      .map(convertToGameInstruction);
    // const instructions = parseGameInstructions(narrative);
    // const cleanedNarrative = cleanNarrativeText(narrative);
    return { narrative, instructions };
  };

  static parseJsonWithNewlines = (json: string) => {
    try {
      // Replace escaped newlines with actual newlines for parsing
      const normalized = json.replace(/\\n/g, '\n');
      return JSON.parse(normalized) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  static convertToGameInstruction = (obj: Record<string, unknown>): GameInstruction => {
    // If it has a type field, use the structured format
    if (
      obj.type === 'roll'
      || obj.type === 'xp'
      || obj.type === 'hp'
      || obj.type === 'spell'
      || obj.type === 'inventory'
    ) {
      return {
        type: obj.type as 'roll' | 'xp' | 'hp' | 'spell' | 'inventory',
        data: obj,
      } as GameInstruction;
    }
    // Otherwise, use the direct format (backward compatibility)
    return obj as GameInstruction;
  };

  /**
 * Match inline JSON objects outside of code blocks
 * First, remove all code blocks to avoid matching JSON inside them
 */
  static extractInlineJson = (text: string): string[] => {
    const textWithoutCodeBlocks = text.replace(/```json(?:\\n|\n|\s)[\s\S]*?(?:\\n|\n|\s)```/g, '');
    return parseNestedJson(textWithoutCodeBlocks);
  };
}
