import test from 'ava';
import util from 'util';
import { DiceService } from '../../src/domain/dice/dice.service.js';
import { CombatDiceResultDto } from '../../src/domain/dice/dto/CombatDiceResultDto.js';
import { CombatModule } from '../../src/modules/combat.module.js';
import {
  closeTestApp,
  createTestApp,
} from '../helpers/test-app.js';

// Helper to convert simple roll arrays into DiceResultDto objects (matching expected output)
function makeDiceResult(rolls: number[]): any {
  return {
    rolls,
    // optional field if rollDiceExpr sets it
    total: rolls.reduce((s, v) => s + v, 0),
  };
}

test('rollDamage computes correct damageTotal for non-crit with damage bonus', async (t) => {
  let ctx;
  try {
    ctx = await createTestApp([CombatModule]);
  } catch (err) {
    const inspected = util.inspect(err, {
      showHidden: true,
      depth: null,
    });
    console.error('Error while setting up test app (non-crit):', inspected);
    throw err;
  }

  try {
    const diceService = ctx.module.get(DiceService) as DiceService;
    // Patch rollDiceExpr to return a single predetermined base roll (4)
    const original = (diceService as any).rollDiceExpr;
    const sequence = [makeDiceResult([4])];
    (diceService as any).rollDiceExpr = () => sequence.shift();

    const result = diceService.rollDamage('1d6', false, 2) as CombatDiceResultDto;

    t.is(result.isCrit, false, 'isCrit should be false for non-crit');
    t.is(result.damageTotal, 6, 'damageTotal should be base(4) + bonus(2) = 6');
    t.deepEqual(result.rolls, [4], 'rolls should contain the base roll');
    // restore
    (diceService as any).rollDiceExpr = original;
  } finally {
    await closeTestApp(ctx);
  }
});

test('rollDamage computes correct damageTotal for critical (extra dice)', async (t) => {
  let ctx;
  try {
    ctx = await createTestApp([CombatModule]);
  } catch (err) {
    const inspected = util.inspect(err, {
      showHidden: true,
      depth: null,
    });
    console.error('Error while setting up test app (crit):', inspected);
    throw err;
  }

  try {
    const diceService = ctx.module.get(DiceService) as DiceService;
    // Patch rollDiceExpr to return base roll then extra roll (5 then 3)
    const original = (diceService as any).rollDiceExpr;
    const sequence = [makeDiceResult([5]), makeDiceResult([3])];
    (diceService as any).rollDiceExpr = () => sequence.shift();

    const result = diceService.rollDamage('1d6', true, 2) as CombatDiceResultDto;

    t.is(result.isCrit, true, 'isCrit should be true for crit');
    t.is(result.damageTotal, 10, 'damageTotal should be base(5)+extra(3)+bonus(2) = 10');
    t.deepEqual(result.rolls, [5], 'rolls should contain the base roll');
    // We intentionally do not assert on extra rolls inside `rolls` (service might fold extra in a different field).
    // restore
    (diceService as any).rollDiceExpr = original;
  } finally {
    await closeTestApp(ctx);
  }
});

test('rollDamage computes correct damageTotal for multi-dice critical (multiple rolls)', async (t) => {
  let ctx;
  try {
    ctx = await createTestApp([CombatModule]);
  } catch (err) {
    const inspected = util.inspect(err, {
      showHidden: true,
      depth: null,
    });
    console.error('Error while setting up test app (multi-dice):', inspected);
    throw err;
  }

  try {
    const diceService = ctx.module.get(DiceService) as DiceService;
    const original = (diceService as any).rollDiceExpr;

    // Base for 2d6: [3,4] -> total 7
    // Extra for critical: [2,3] -> total 5
    const sequence = [makeDiceResult([3, 4]), makeDiceResult([2, 3])];
    (diceService as any).rollDiceExpr = () => sequence.shift();

    const result = diceService.rollDamage('2d6', true, 1) as CombatDiceResultDto;

    t.is(result.isCrit, true, 'isCrit should be true for crit');
    t.is(result.damageTotal, 13, 'damageTotal should be 7 + 5 + 1 = 13');
    t.deepEqual(result.rolls, [3, 4], 'rolls should contain the base rolls');
    (diceService as any).rollDiceExpr = original;
  } finally {
    await closeTestApp(ctx);
  }
});
