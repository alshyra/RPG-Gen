import test from 'ava';
import { parseAIResponse, parseInstructions, cleanNarrativeText } from '../src/external/text/ai-parser.util.js';

test('parses JSON from a ```json``` code block', (t) => {
  const input = 'You see a wound.\n```json\n{"type":"hp","hp":-5}\n```\nAnd the party reacts.';

  const parsed = parseAIResponse(input);
  t.is(parsed.instructions.length, 1);
  t.is((parsed.instructions[0] as any).type, 'hp');
  t.is(parsed.text.includes('You see a wound.'), true);
});

test('parses inline JSON and removes it from narrative', (t) => {
  const input = `The wizard mutters {"type":"xp","xp":10} and smiles.`;
  const instructions = parseInstructions(input);
  t.is(instructions.length, 1);
  t.is((instructions[0] as any).type, 'xp');

  const cleaned = cleanNarrativeText(input);
  t.false(cleaned.includes('{"type":"xp","xp":10}'));
  t.true(cleaned.includes('The wizard mutters'));
});
