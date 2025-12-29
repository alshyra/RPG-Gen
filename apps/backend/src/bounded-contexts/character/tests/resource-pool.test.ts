import { ResourcePool } from "../domain/value-objects/ResourcePool.js";

describe('ResourcePool', () => {
  test("creates with valid values", () => {
    const pool = new ResourcePool(5, 10);

    expect(pool.current).toBe(5);
    expect(pool.max).toBe(10);
  });

  test("throws when current exceeds max", () => {
    expect(() => {
      new ResourcePool(15, 10);
    }).toThrow("Current cannot exceed max");
  });

  test("throws when max is negative", () => {
    expect(() => {
      new ResourcePool(5, -1);
    }).toThrow("Max value cannot be negative");
  });

  test("throws when current is negative", () => {
    expect(() => {
      new ResourcePool(-1, 10);
    }).toThrow("Current value cannot be negative");
  });

  test("spend reduces current", () => {
    const pool = new ResourcePool(10, 10);
    const newPool = pool.spend(3);

    expect(newPool.current).toBe(7);
    expect(newPool.max).toBe(10);
    expect(pool.current).toBe(10); // Original unchanged
  });

  test("spend throws on insufficient resources", () => {
    const pool = new ResourcePool(5, 10);

    expect(() => {
      pool.spend(6);
    }).toThrow("Insufficient resources");
  });

  test("reduce clamps to zero", () => {
    const pool = new ResourcePool(5, 10);
    const newPool = pool.reduce(10);

    expect(newPool.current).toBe(0);
    expect(newPool.max).toBe(10);
  });

  test("restore fills to max", () => {
    const pool = new ResourcePool(3, 10);
    const newPool = pool.restore();

    expect(newPool.current).toBe(10);
    expect(newPool.max).toBe(10);
  });

  test("add increases current capped at max", () => {
    const pool = new ResourcePool(5, 10);
    const newPool = pool.add(10);

    expect(newPool.current).toBe(10);
    expect(newPool.max).toBe(10);
  });

  test("isEmpty returns true when current is 0", () => {
    const pool = new ResourcePool(0, 10);

    expect(pool.isEmpty()).toBe(true);
  });

  test("isFull returns true when current equals max", () => {
    const pool = new ResourcePool(10, 10);

    expect(pool.isFull()).toBe(true);
  });

  test("getPercentage returns correct value", () => {
    const pool = new ResourcePool(5, 10);

    expect(pool.getPercentage()).toBe(50);
  });

  test("create factory creates full pool", () => {
    const pool = ResourcePool.create(10);

    expect(pool.current).toBe(10);
    expect(pool.max).toBe(10);
  });

  test("createEmpty factory creates empty pool", () => {
    const pool = ResourcePool.createEmpty(10);

    expect(pool.current).toBe(0);
    expect(pool.max).toBe(10);
  });
});
