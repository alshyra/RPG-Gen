import test from "ava";
import { TalentProgress } from "../domain/value-objects/TalentRank.js";

test("TalentProgress - creates with valid values", t => {
  const rank = new TalentProgress("voie_protection", 3);

  t.is(rank.voieId, "voie_protection");
  t.is(rank.rank, 3);
});

test("TalentProgress - throws on empty voieId", t => {
  t.throws(() => {
    new TalentProgress("", 1);
  }, { message: "VoieId cannot be empty" });
});

test("TalentProgress - throws on rank below minimum", t => {
  t.throws(() => {
    new TalentProgress("voie_protection", 0);
  }, { message: "Rank must be between 1 and 5" });
});

test("TalentProgress - throws on rank above maximum", t => {
  t.throws(() => {
    new TalentProgress("voie_protection", 6);
  }, { message: "Rank must be between 1 and 5" });
});

test("TalentProgress - canUnlockNext returns true when not at max", t => {
  const rank = new TalentProgress("voie_protection", 4);

  t.true(rank.canUnlockNext());
});

test("TalentProgress - canUnlockNext returns false at max rank", t => {
  const rank = new TalentProgress("voie_protection", 5);

  t.false(rank.canUnlockNext());
});

test("TalentProgress - unlockNext returns new instance with incremented rank", t => {
  const rank = new TalentProgress("voie_protection", 3);
  const newRank = rank.unlockNext();

  t.is(newRank.rank, 4);
  t.is(newRank.voieId, "voie_protection");
  t.is(rank.rank, 3); // Original unchanged
});

test("TalentProgress - unlockNext throws at max rank", t => {
  const rank = new TalentProgress("voie_protection", 5);

  t.throws(() => {
    rank.unlockNext();
  }, { message: "Already at maximum rank" });
});

test("TalentProgress - isMaxRank returns true at rank 5", t => {
  const rank = new TalentProgress("voie_protection", 5);

  t.true(rank.isMaxRank());
});

test("TalentProgress - isMaxRank returns false below rank 5", t => {
  const rank = new TalentProgress("voie_protection", 4);

  t.false(rank.isMaxRank());
});

test("TalentProgress - toPlainObject returns plain object", t => {
  const rank = new TalentProgress("voie_protection", 3);
  const plain = rank.toPlainObject();

  t.deepEqual(plain, {
    voieId: "voie_protection",
    rank: 3,
  });
});

test("TalentProgress - createFirst factory creates rank 1", t => {
  const rank = TalentProgress.createFirst("voie_assassin");

  t.is(rank.voieId, "voie_assassin");
  t.is(rank.rank, 1);
});
