export interface GameInstruction {
  type?: "roll" | "xp" | "hp";
  data?: Record<string, unknown>;
  roll?: { dices: string; modifier?: string; description?: string };
  hp?: number;
  xp?: number;
}

const extractJsonBlocks = (text: string): string[] => {
  const jsonMatches = Array.from(text.matchAll(/```json\n([\s\S]*?)\n```/g));
  return jsonMatches.map((m) => m[1]);
}

export const parseGameInstructions = (narrative: string): GameInstruction[] =>
  extractJsonBlocks(narrative)
    .map((json) => {
      try {
        return JSON.parse(json) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((obj): obj is Record<string, unknown> => obj !== null)
    .filter((obj) => obj.type === "roll" || obj.type === "xp" || obj.type === "hp")
    .map((obj) => ({ type: obj.type as "roll" | "xp" | "hp", data: obj }));

export const cleanNarrativeText = (narrative: string): string =>
  narrative
    .replace(/```json\n[\s\S]*?\n```/g, "")
    .replace(/\n\n+/g, "\n")
    .trim();

export const parseGameResponse = extractInstructions;

export function extractInstructions(narrative: string): {
  narrative: string;
  instructions: GameInstruction[];
} {
  const instructions = parseGameInstructions(narrative);
  const cleanedNarrative = cleanNarrativeText(narrative);
  return { narrative: cleanedNarrative, instructions };
}
