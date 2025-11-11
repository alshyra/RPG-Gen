/**
 * Parse game instructions (roll, xp, hp) from Gemini text response.
 * Extracts JSON objects like {"roll": {...}}, {"xp": ...}, {"hp": ...}
 */
export interface GameInstruction {
  roll?: {
    dices: string; // e.g., "1d20", "2d6+3"
    modifier?: string; // e.g., "dexterity", "strength"
    description?: string;
  };
  xp?: number;
  hp?: number;
}

export interface ParsedGameResponse {
  narrative: string; // cleaned text without JSON
  instructions: GameInstruction[];
}

export function parseGameResponse(text: string): ParsedGameResponse {
  const instructions: GameInstruction[] = [];
  let narrative = text;

  // Normalize escaped newlines to actual newlines for parsing
  const normalizedText = text.replace(/\\n/g, '\n');

  // Pattern to match markdown code blocks with JSON
  // Handles: ```json {...} ``` or ``` {...} ``` with possible newlines inside
  const codeBlockPattern = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
  
  let match;
  while ((match = codeBlockPattern.exec(normalizedText)) !== null) {
    const jsonText = match[1];
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.roll || typeof parsed.xp === 'number' || typeof parsed.hp === 'number') {
        instructions.push(parsed);
      }
    } catch (e) {
      console.error('Failed to parse JSON:', jsonText, e);
    }
  }

  // If we found instructions in code blocks, remove them from narrative
  if (instructions.length > 0) {
    narrative = normalizedText.replace(codeBlockPattern, '');
  } else {
    // Fallback: try to find JSON objects in remaining text
    const jsonMatches: Array<{ start: number; end: number; text: string }> = [];
    
    let depth = 0;
    let currentStart = -1;
    
    for (let i = 0; i < narrative.length; i++) {
      const char = narrative[i];
      
      if (char === '{') {
        if (depth === 0) currentStart = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && currentStart !== -1) {
          const jsonText = narrative.substring(currentStart, i + 1);
          jsonMatches.push({ start: currentStart, end: i + 1, text: jsonText });
          currentStart = -1;
        }
      }
    }

    // Try to parse each JSON object found
    for (const match of jsonMatches) {
      try {
        const parsed = JSON.parse(match.text);
        // Check if it's a valid game instruction
        if (parsed.roll || typeof parsed.xp === 'number' || typeof parsed.hp === 'number') {
          instructions.push(parsed);
        }
      } catch (_) {
        // Not valid JSON or not a game instruction
      }
    }

    // Remove all valid instruction JSONs from narrative
    for (const match of jsonMatches.reverse()) {
      // Only remove if it was a valid instruction
      if (instructions.some(instr => 
        (instr.roll && match.text.includes('roll')) ||
        (instr.xp && match.text.includes('xp')) ||
        (instr.hp && match.text.includes('hp'))
      )) {
        narrative = narrative.substring(0, match.start) + narrative.substring(match.end);
      }
    }
  }

  // Clean up extra whitespace and unescape
  narrative = narrative.replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();

  return { narrative, instructions };
}

/**
 * Roll dice based on notation like "1d20", "2d6", "1d20+5"
 */
export function rollDice(notation: string): { rolls: number[]; total: number } {
  const match = notation.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
  if (!match) throw new Error(`Invalid dice notation: ${notation}`);

  const numDice = parseInt(match[1], 10);
  const diceSize = parseInt(match[2], 10);
  const bonus = match[3] ? parseInt(match[3], 10) : 0;

  const rolls: number[] = [];
  for (let i = 0; i < numDice; i++) {
    rolls.push(Math.floor(Math.random() * diceSize) + 1);
  }

  const total = rolls.reduce((sum, roll) => sum + roll, 0) + bonus;
  return { rolls, total };
}

/**
 * Get a modifier value from character stats
 */
export function getModifierValue(character: any, modifierName?: string): number {
  if (!modifierName || !character) return 0;

  const modLower = modifierName.toLowerCase();

  // Map common modifier names to character ability score modifiers
  const abilityMap: Record<string, string> = {
    strength: 'strength',
    str: 'strength',
    dexterity: 'dexterity',
    dex: 'dexterity',
    constitution: 'constitution',
    con: 'constitution',
    intelligence: 'intelligence',
    int: 'intelligence',
    wisdom: 'wisdom',
    wis: 'wisdom',
    charisma: 'charisma',
    cha: 'charisma',
  };

  const abilityName = abilityMap[modLower];
  if (!abilityName) return 0;

  // Get ability score from character (assuming D&D 5e scoring)
  const abilityScore = character.abilities?.[abilityName] || 10;
  const modifier = Math.floor((abilityScore - 10) / 2);
  return modifier;
}
