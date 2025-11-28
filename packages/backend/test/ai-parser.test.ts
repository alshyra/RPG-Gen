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

test('parses canonical combat_start with type', (t) => {
  const input = 'Narration before.\n\n```json\n{"type":"combat_start","combat_start": [{"name":"Goblin A","hp":7,"ac":13},{"name":"Goblin B","hp":7,"ac":13}]}\n```\nMore text.';
  const parsed = parseAIResponse(input);
  t.true(parsed.instructions.length >= 1);
  const inst = parsed.instructions.find(i => (i as any).type === 'combat_start');
  t.truthy(inst);
  const cs = (inst as any).combat_start;
  t.is(cs.length, 2);
  t.is(cs[0].name, 'Goblin A');
});

test('parses backwards-compatible combat_start without type', (t) => {
  const input = 'Lead in...\n\n```json\n{"combat_start": [{"name":"Gobelin 1","hp":7,"ac":13,"attack_bonus":4,"damage_dice":"1d6","damage_bonus":2},{"name":"Gobelin 2","hp":7,"ac":13}]}\n```\n';
  const parsed = parseAIResponse(input);
  const inst = parsed.instructions.find(i => (i as any).combat_start);
  t.truthy(inst);
  const cs = (inst as any).combat_start;
  t.is(cs.length, 2);
  t.is(cs[0].name, 'Gobelin 1');
});

test('parses inventory add instruction', (t) => {
  const input = 'Story.\n\n```json\n{"type":"inventory","action":"add","name":"Potion of Healing","quantity":1}\n```\n';
  const parsed = parseAIResponse(input);
  const inst = parsed.instructions.find(i => (i as any).type === 'inventory');
  t.truthy(inst);
  t.is((inst as any).action, 'add');
  t.is((inst as any).name, 'Potion of Healing');
});

test('parses roll request instruction', (t) => {
  const input = 'Prepare to roll.\n\n```json\n{"type":"roll","dices":"1d20","modifier":"wisdom (Perception)","advantage":"none"}\n```\n';
  const parsed = parseAIResponse(input);
  const inst = parsed.instructions.find(i => (i as any).type === 'roll');
  t.truthy(inst);
  t.is((inst as any).dices, '1d20');
});

test('parses hp and xp instructions', (t) => {
  const input = 'After hit.\n\n```json\n{"type":"hp","hp":-8}\n```\n';
  let parsed = parseAIResponse(input);
  let inst = parsed.instructions.find(i => (i as any).type === 'hp');
  t.truthy(inst);
  t.is((inst as any).hp, -8);

  const input2 = 'Reward.\n\n```json\n{"type":"xp","xp":150}\n```\n';
  parsed = parseAIResponse(input2);
  inst = parsed.instructions.find(i => (i as any).type === 'xp');
  t.truthy(inst);
  t.is((inst as any).xp, 150);
});

test('parses spell learn and cast instructions', (t) => {
  const input = 'Spell learned.\n\n```json\n{"type":"spell","action":"learn","name":"Fireball","level":3,"school":"Evocation"}\n```\n';
  let parsed = parseAIResponse(input);
  let inst = parsed.instructions.find(i => (i as any).type === 'spell');
  t.truthy(inst);
  t.is((inst as any).action, 'learn');
  t.is((inst as any).name, 'Fireball');

  const input2 = 'Casting.\n\n```json\n{"type":"spell","action":"cast","name":"Fireball"}\n```\n';
  parsed = parseAIResponse(input2);
  inst = parsed.instructions.find(i => (i as any).type === 'spell');
  t.truthy(inst);
  t.is((inst as any).action, 'cast');
});

test('parses combat_end with type', (t) => {
  const input = 'End narration.\n\n```json\n{"type":"combat_end","combat_end":{"victory":true,"xp_gained":100,"player_hp":15,"enemies_defeated":["Goblin"]}}\n```\n';
  const parsed = parseAIResponse(input);
  const inst = parsed.instructions.find(i => (i as any).type === 'combat_end');
  t.truthy(inst);
  t.is(((inst as any).combat_end).xp_gained, 100);
});
