import test from "ava";
import { TalentProgress } from "../../../src/bounded-contexts/character/domain/value-objects/TalentRank.js";

test("TalentRank - creates with valid values", t => {
  const rank = new TalentProgress("voie_protection", 3);

  t.is(rank.voieId, "voie_protection");
  t.is(rank.rank, 3);
});

test("TalentRank - throws on empty voieId", t => {
  t.throws(() => {
    new TalentProgress("", 1);
  }, { message: "VoieId cannot be empty" });
});

test("TalentRank - throws on rank below minimum", t => {
  t.throws(() => {
    new TalentProgress("voie_protection", 0);
  }, { message: "Rank must be between 1 and 5" });
});

test("TalentRank - throws on rank above maximum", t => {
  t.throws(() => {
    new TalentProgress("voie_protection", 6);
  }, { message: "Rank must be between 1 and 5" });
});

test("TalentRank - canUnlockNext returns true when not at max", t => {
  const rank = new TalentProgress("voie_protection", 4);

  t.true(rank.canUnlockNext());
});

test("TalentRank - canUnlockNext returns false at max rank", t => {
  const rank = new TalentProgress("voie_protection", 5);

  t.false(rank.canUnlockNext());
});

test("TalentRank - unlockNext returns new instance with incremented rank", t => {
  const rank = new TalentProgress("voie_protection", 3);
  const newRank = rank.unlockNext();

  t.is(newRank.rank, 4);
  t.is(newRank.voieId, "voie_protection");
  t.is(rank.rank, 3); // Original unchanged
});

test("TalentRank - unlockNext throws at max rank", t => {
  const rank = new TalentProgress("voie_protection", 5);

  t.throws(() => {
    rank.unlockNext();
  }, { message: "Already at maximum rank" });
});

test("TalentRank - isMaxRank returns true at rank 5", t => {
  const rank = new TalentProgress("voie_protection", 5);

  t.true(rank.isMaxRank());
});

test("TalentRank - isMaxRank returns false below rank 5", t => {
  const rank = new TalentProgress("voie_protection", 4);

  t.false(rank.isMaxRank());
});

test("TalentRank - toPlainObject returns plain object", t => {
  const rank = new TalentProgress("voie_protection", 3);
  const plain = rank.toPlainObject();

  t.deepEqual(plain, {
    voieId: "voie_protection",
    rank: 3,
  });
});

test("TalentRank - createFirst factory creates rank 1", t => {
  const rank = TalentProgress.createFirst("voie_assassin");

  t.is(rank.voieId, "voie_assassin");
  t.is(rank.rank, 1);
});
