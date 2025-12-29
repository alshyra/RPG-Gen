import { CharacterStats } from "../domain/value-objects/CharacterStats.js";

describe('CharacterStatsVO', () => {
  test("creates with valid stats", () => {
    const stats = new CharacterStats({
      vigor: 5,
      finesse: 3,
      mind: 2,
      survival: 4,
    });

    expect(stats.vigor).toBe(5);
    expect(stats.finesse).toBe(3);
    expect(stats.mind).toBe(2);
    expect(stats.survival).toBe(4);
  });

  test("throws on negative stats", () => {
    expect(() => {
      new CharacterStats({
        vigor: -1,
        finesse: 3,
        mind: 2,
        survival: 4,
      });
    }).toThrow("Stats cannot be negative");
  });

  test("getTotalPoints returns sum of all stats", () => {
    const stats = new CharacterStats({
      vigor: 5,
      finesse: 3,
      mind: 2,
      survival: 4,
    });

    expect(stats.getTotalPoints()).toBe(14);
  });

  test("getVigorModifier returns floor of vigor / 2", () => {
    const stats = new CharacterStats({
      vigor: 5,
      finesse: 3,
      mind: 2,
      survival: 4,
    });

    expect(stats.getVigorModifier()).toBe(2);
  });

  test("withVigor returns new instance with updated vigor", () => {
    const stats = new CharacterStats({
      vigor: 5,
      finesse: 3,
      mind: 2,
      survival: 4,
    });

    const newStats = stats.withVigor(10);

    expect(newStats.vigor).toBe(10);
    expect(newStats.finesse).toBe(3);
    expect(stats.vigor).toBe(5); // Original unchanged
  });

  test("toPlainObject returns plain object", () => {
    const stats = new CharacterStats({
      vigor: 5,
      finesse: 3,
      mind: 2,
      survival: 4,
    });

    const plain = stats.toPlainObject();

    expect(plain).toEqual({
      vigor: 5,
      finesse: 3,
      mind: 2,
      survival: 4,
    });
  });

  test("createDefault returns zeroed stats", () => {
    const stats = CharacterStats.createDefault();

    expect(stats.vigor).toBe(0);
    expect(stats.finesse).toBe(0);
    expect(stats.mind).toBe(0);
    expect(stats.survival).toBe(0);
  });
});
