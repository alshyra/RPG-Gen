import { TalentProgress } from "../domain/value-objects/TalentRank.js";

describe('TalentProgress', () => {
  test("creates with valid values", () => {
    const rank = new TalentProgress("voie_protection", 3);

    expect(rank.voieId).toBe("voie_protection");
    expect(rank.rank).toBe(3);
  });

  test("throws on empty voieId", () => {
    expect(() => {
      new TalentProgress("", 1);
    }).toThrow("VoieId cannot be empty");
  });

  test("throws on rank below minimum", () => {
    expect(() => {
      new TalentProgress("voie_protection", 0);
    }).toThrow("Rank must be between 1 and 5");
  });

  test("throws on rank above maximum", () => {
    expect(() => {
      new TalentProgress("voie_protection", 6);
    }).toThrow("Rank must be between 1 and 5");
  });

  test("canUnlockNext returns true when not at max", () => {
    const rank = new TalentProgress("voie_protection", 4);

    expect(rank.canUnlockNext()).toBe(true);
  });

  test("canUnlockNext returns false at max rank", () => {
    const rank = new TalentProgress("voie_protection", 5);

    expect(rank.canUnlockNext()).toBe(false);
  });

  test("unlockNext returns new instance with incremented rank", () => {
    const rank = new TalentProgress("voie_protection", 3);
    const newRank = rank.unlockNext();

    expect(newRank.rank).toBe(4);
    expect(newRank.voieId).toBe("voie_protection");
    expect(rank.rank).toBe(3); // Original unchanged
  });

  test("unlockNext throws at max rank", () => {
    const rank = new TalentProgress("voie_protection", 5);

    expect(() => {
      rank.unlockNext();
    }).toThrow("Already at maximum rank");
  });

  test("isMaxRank returns true at rank 5", () => {
    const rank = new TalentProgress("voie_protection", 5);

    expect(rank.isMaxRank()).toBe(true);
  });

  test("isMaxRank returns false below rank 5", () => {
    const rank = new TalentProgress("voie_protection", 4);

    expect(rank.isMaxRank()).toBe(false);
  });

  test("toPlainObject returns plain object", () => {
    const rank = new TalentProgress("voie_protection", 3);
    const plain = rank.toPlainObject();

    expect(plain).toEqual({
      voieId: "voie_protection",
      rank: 3,
    });
  });

  test("createFirst factory creates rank 1", () => {
    const rank = TalentProgress.createFirst("voie_assassin");

    expect(rank.voieId).toBe("voie_assassin");
    expect(rank.rank).toBe(1);
  });
});
