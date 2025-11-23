import test from 'ava';
import { DiceController } from '../src/dice/dice.controller.js';

test('rollDiceExpr parses and rolls correctly with deterministic RNG', (t) => {
  const seq = [0.1, 0.2];
  let i = 0;
  const rng = () => seq[i++ % seq.length];
  const res = (new DiceController()).rollDiceExpr('2d6+1', rng);
  // rolls: 1 + floor(0.1*6)=1, 1 + floor(0.2*6)=2 => [1,2]
  t.deepEqual(res.rolls, [1, 2]);
  t.is(res.mod, 1);
  t.is(res.total, 4);
});

test('rollDiceExpr single die default count', (t) => {
  const rng = () => 0.49; // 1 + floor(0.49*20)=1 + 9 = 10 for d20
  const res = (new DiceController()).rollDiceExpr('d20', rng);
  t.is(res.rolls.length, 1);
  t.is(res.rolls[0], 1 + Math.floor(0.49 * 20));
});

test('rollDiceExpr invalid expressions throw', (t) => {
  const err = t.throws(() => (new DiceController()).rollDiceExpr('abc'));
  t.truthy(err);
});

test('rollDiceExpr with advantage keeps best of 2d20', (t) => {
  const seq = [0.3, 0.7]; // rolls 7 and 15
  let i = 0;
  const rng = () => seq[i++ % seq.length];
  const res = (new DiceController()).rollDiceExpr('1d20', rng, 'advantage');
  t.is(res.rolls.length, 2);
  t.deepEqual(res.rolls, [7, 15]);
  t.is(res.keptRoll, 15);
  t.is(res.discardedRoll, 7);
  t.is(res.total, 15);
  t.is(res.advantage, 'advantage');
});

test('rollDiceExpr with disadvantage keeps worst of 2d20', (t) => {
  const seq = [0.3, 0.7]; // rolls 7 and 15
  let i = 0;
  const rng = () => seq[i++ % seq.length];
  const res = (new DiceController()).rollDiceExpr('1d20', rng, 'disadvantage');
  t.is(res.rolls.length, 2);
  t.deepEqual(res.rolls, [7, 15]);
  t.is(res.keptRoll, 7);
  t.is(res.discardedRoll, 15);
  t.is(res.total, 7);
  t.is(res.advantage, 'disadvantage');
});

test('rollDiceExpr with advantage includes modifier', (t) => {
  const seq = [0.5, 0.8]; // rolls 11 and 17
  let i = 0;
  const rng = () => seq[i++ % seq.length];
  const res = (new DiceController()).rollDiceExpr('1d20+5', rng, 'advantage');
  t.is(res.keptRoll, 17);
  t.is(res.mod, 5);
  t.is(res.total, 22); // 17 + 5
});

test('rollDiceExpr advantage only applies to 1d20', (t) => {
  const seq = [0.1, 0.2, 0.3];
  let i = 0;
  const rng = () => seq[i++ % seq.length];
  const res = (new DiceController()).rollDiceExpr('2d6', rng, 'advantage');
  // Should roll normally, not with advantage
  t.is(res.rolls.length, 2);
  t.is(res.advantage, 'none');
});
