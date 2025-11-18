import test from 'ava';
import { rollDiceExpr } from '../src/dice/dice.util';

test('rollDiceExpr parses and rolls correctly with deterministic RNG', t => {
  const seq = [0.1, 0.2];
  let i = 0;
  const rng = () => seq[i++ % seq.length];
  const res = rollDiceExpr('2d6+1', rng);
  // rolls: 1 + floor(0.1*6)=1, 1 + floor(0.2*6)=2 => [1,2]
  t.deepEqual(res.rolls, [1,2]);
  t.is(res.mod, 1);
  t.is(res.total, 4);
});

test('rollDiceExpr single die default count', t => {
  const rng = () => 0.49; // 1 + floor(0.49*20)=1 + 9 = 10 for d20
  const res = rollDiceExpr('d20', rng);
  t.is(res.rolls.length, 1);
  t.is(res.rolls[0], 1 + Math.floor(0.49 * 20));
});

test('rollDiceExpr invalid expressions throw', t => {
  const err = t.throws(() => rollDiceExpr('abc'));
  t.truthy(err);
});
