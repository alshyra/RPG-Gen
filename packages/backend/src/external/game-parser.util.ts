import type { GameInstruction } from '@rpg-gen/shared';

// Re-export for convenience
export type { GameInstruction } from '@rpg-gen/shared';

const extractJsonBlocks = (text: string): string[] => {
  // Handle both actual newlines and escaped newlines (literal \n) in code blocks
  // Also handle spaces before/after the JSON
  const jsonMatches = Array.from(text.matchAll(/```json(?:\\n|\n|\s)([\s\S]*?)(?:\\n|\n|\s)```/g));
  return jsonMatches.map(m => m[1].trim()).filter(Boolean);
};

const parseNestedJson = (text: string): string[] => {
  const results: string[] = [];
  let depth = 0;
  let start = -1;

  const chars = text.split('');
  chars.forEach((char, i) => {
    if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        results.push(text.substring(start, i + 1));
        start = -1;
      }
    }
  });

  return results;
};

const extractInlineJson = (text: string): string[] => {
  // Match JSON objects that are not in code blocks
  // First, remove all code blocks to avoid matching JSON inside them
  const textWithoutCodeBlocks = text.replace(/```json(?:\\n|\n|\s)[\s\S]*?(?:\\n|\n|\s)```/g, '');
  return parseNestedJson(textWithoutCodeBlocks);
};

const isGameInstruction = (obj: Record<string, unknown>): boolean => {
  // Check if object has type field with valid value
  if (obj.type === 'roll' || obj.type === 'xp' || obj.type === 'hp' || obj.type === 'spell' || obj.type === 'inventory') {
    return true;
  }
  // Check if object has instruction fields directly (backward compatibility)
  if (obj.roll || obj.xp !== undefined || obj.hp !== undefined || obj.spell || obj.inventory) {
    return true;
  }
  return false;
};

export const parseGameInstructions = (narrative: string): GameInstruction[] => {
  const jsonBlocks = extractJsonBlocks(narrative);
  const inlineJsons = extractInlineJson(narrative);
  const allJsons = [...jsonBlocks, ...inlineJsons];

  return allJsons
    .map((json) => {
      try {
        // Replace escaped newlines with actual newlines for parsing
        const normalized = json.replace(/\\n/g, '\n');
        return JSON.parse(normalized) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((obj): obj is Record<string, unknown> => obj !== null)
    .filter(isGameInstruction)
    .map((obj) => {
      // If it has a type field, use the structured format
      if (obj.type === 'roll' || obj.type === 'xp' || obj.type === 'hp' || obj.type === 'spell' || obj.type === 'inventory') {
        return { type: obj.type as 'roll' | 'xp' | 'hp' | 'spell' | 'inventory', data: obj } as GameInstruction;
      }
      // Otherwise, use the direct format (backward compatibility)
      return obj as GameInstruction;
    });
};

export const cleanNarrativeText = (narrative: string): string => {
  const cleaned = narrative
    // Remove JSON code blocks (both actual and escaped newlines, with possible spaces)
    .replace(/```json(?:\\n|\n|\s)[\s\S]*?(?:\\n|\n|\s)```/g, '')
    // Remove inline JSON objects (avoiding code blocks)
    .replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, (match) => {
      // Only remove if it's a game instruction
      try {
        const obj = JSON.parse(match.replace(/\\n/g, '\n'));
        if (isGameInstruction(obj)) return '';
        return match;
      } catch {
        return match;
      }
    })
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim();

  return cleaned;
};

export const parseGameResponse = extractInstructions;

export function extractInstructions(narrative: string): {
  narrative: string;
  instructions: GameInstruction[];
} {
  const instructions = parseGameInstructions(narrative);
  const cleanedNarrative = cleanNarrativeText(narrative);
  return { narrative: cleanedNarrative, instructions };
}
