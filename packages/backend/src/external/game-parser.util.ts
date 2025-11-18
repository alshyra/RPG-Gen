const extractJsonBlocks = (text: string): string[] => {
  // Handle both actual newlines and escaped newlines (literal \n) in code blocks
  // Also handle spaces before/after the JSON
  const jsonMatches = Array.from(text.matchAll(/```json(?:\\n|\n|\s)([\s\S]*?)(?:\\n|\n|\s)```/g));
  return jsonMatches.map(m => m[1].trim()).filter(Boolean);
};

// use shared type definitions produced by the DTO generator in @rpg/shared
import type { GameInstruction, GameMessage, GameResponse } from '@rpg/shared';

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



const isGameInstruction = (obj: Record<string, unknown>): boolean => {
  // Check if object has type field with valid value
  if (
    obj.type === 'roll'
    || obj.type === 'xp'
    || obj.type === 'hp'
    || obj.type === 'spell'
    || obj.type === 'inventory'
  ) {
    return true;
  }
  // Check if object has instruction fields directly (backward compatibility)
  if (obj.roll || obj.xp !== undefined || obj.hp !== undefined || obj.spell || obj.inventory) {
    return true;
  }
  return false;
};



export const parseGameInstructions = (narrative: string): GameInstruction[] => {

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
