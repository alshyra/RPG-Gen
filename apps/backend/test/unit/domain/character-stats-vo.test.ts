import test from "ava";
import { CharacterStats } from "../../../src/bounded-contexts/character/domain/value-objects/CharacterStats.js";

test("CharacterStatsVO - creates with valid stats", t => {
  const stats = new CharacterStats({
    vigor: 5,
    finesse: 3,
    mind: 2,
    survival: 4,
  });

  t.is(stats.vigor, 5);
  t.is(stats.finesse, 3);
  t.is(stats.mind, 2);
  t.is(stats.survival, 4);
});

test("CharacterStatsVO - throws on negative stats", t => {
  t.throws(() => {
    new CharacterStats({
      vigor: -1,
      finesse: 3,
      mind: 2,
      survival: 4,
    });
  }, { message: "Stats cannot be negative" });
});

test("CharacterStatsVO - getTotalPoints returns sum of all stats", t => {
  const stats = new CharacterStats({
    vigor: 5,
    finesse: 3,
    mind: 2,
    survival: 4,
  });

  t.is(stats.getTotalPoints(), 14);
});

test("CharacterStatsVO - getVigorModifier returns floor of vigor / 2", t => {
  const stats = new CharacterStats({
    vigor: 5,
    finesse: 3,
    mind: 2,
    survival: 4,
  });

  t.is(stats.getVigorModifier(), 2);
});

test("CharacterStatsVO - withVigor returns new instance with updated vigor", t => {
  const stats = new CharacterStats({
    vigor: 5,
    finesse: 3,
    mind: 2,
    survival: 4,
  });

  const newStats = stats.withVigor(10);

  t.is(newStats.vigor, 10);
  t.is(newStats.finesse, 3);
  t.is(stats.vigor, 5); // Original unchanged
});

test("CharacterStatsVO - toPlainObject returns plain object", t => {
  const stats = new CharacterStats({
    vigor: 5,
    finesse: 3,
    mind: 2,
    survival: 4,
  });

  const plain = stats.toPlainObject();

  t.deepEqual(plain, {
    vigor: 5,
    finesse: 3,
    mind: 2,
    survival: 4,
  });
});

test("CharacterStatsVO - createDefault returns zeroed stats", t => {
  const stats = CharacterStats.createDefault();

  t.is(stats.vigor, 0);
  t.is(stats.finesse, 0);
  t.is(stats.mind, 0);
  t.is(stats.survival, 0);
});
