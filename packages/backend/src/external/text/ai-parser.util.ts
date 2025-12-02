import { ChatMessageDto } from '../../chat/dto/ChatMessageDto.js';
import type { GameInstructionDto } from '../../chat/dto/GameInstructionDto.js';
import JSONC from 'jsonc-simple-parser';

const tryParse = (s: string): unknown => {
  try {
    // allow JSONC tolerant syntax
    return JSONC.parse(s);
  } catch {
    return null;
  }
};

// Collect JSON candidates: code-blocks first, then simple {...} matches.
const collectCandidates = (text: string): string[] => {
  const candidates: string[] = [];
  // code blocks: ```json ... ```
  const blockMatches = Array.from(text.matchAll(/```json[^\n]*\n([\s\S]*?)```/g));
  blockMatches.forEach(m => m[1] && candidates.push(m[1].trim()));
  // inline-ish JSON: non-greedy brace pairs but exclude regions inside code blocks
  const withoutBlocks = text.replace(/```json[^\n]*\n([\s\S]*?)```/g, '');
  const inlineMatches = Array.from(withoutBlocks.matchAll(/\{[\s\S]*?\}/g));
  inlineMatches.forEach(m => m[0] && candidates.push(m[0]));
  return candidates;
};

export const extractInstructions = (text: string): unknown[] => {
  const candidates = collectCandidates(text);
  const parsed = candidates
    .map(c => tryParse(c))
    .filter(p => p !== null);
  return parsed;
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// Minimal normalizer: if object has a `type` string, accept it as-is.
// Also handle backward-compatible formats like {"combat_start": [...]} without a type.
export const normalizeInstruction = (raw: unknown): GameInstructionDto | null => {
  if (!isObject(raw)) return null;
  if (typeof raw['type'] === 'string') {
    return raw as unknown as GameInstructionDto;
  }
  // Backward compatibility: {"combat_start": [...]} without type field
  if (Array.isArray(raw['combat_start'])) {
    return {
      type: 'combat_start',
      combat_start: raw['combat_start'],
    } as unknown as GameInstructionDto;
  }
  // Backward compatibility: {"combat_end": {...}} without type field
  if (isObject(raw['combat_end'])) {
    return {
      type: 'combat_end',
      combat_end: raw['combat_end'],
    } as unknown as GameInstructionDto;
  }
  return null;
};

export const parseInstructions = (text: string): GameInstructionDto[] => extractInstructions(text)
  .map(r => normalizeInstruction(r))
  .filter(Boolean) as GameInstructionDto[];

export const cleanNarrativeText = (narrative: string): string => {
  const candidates = collectCandidates(narrative);
  let cleaned = narrative;
  candidates
    .filter(c => tryParse(c) !== null)
    .forEach(c => cleaned = cleaned.replace(c, ''));
  // remove leftover triple-backtick blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  return cleaned.replace(/\s+/g, ' ')
    .trim();
};

export const parseAIResponse = (text: string): ChatMessageDto => ({
  role: 'assistant',
  narrative: cleanNarrativeText(text),
  instructions: parseInstructions(text),
});
