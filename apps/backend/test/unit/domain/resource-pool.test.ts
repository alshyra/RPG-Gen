import test from "ava";
import { ResourcePool } from "../../../src/domain/character/value-objects/ResourcePool.js";

test("ResourcePool - creates with valid values", t => {
  const pool = new ResourcePool(5, 10);

  t.is(pool.current, 5);
  t.is(pool.max, 10);
});

test("ResourcePool - throws when current exceeds max", t => {
  t.throws(() => {
    new ResourcePool(15, 10);
  }, { message: "Current cannot exceed max" });
});

test("ResourcePool - throws when max is negative", t => {
  t.throws(() => {
    new ResourcePool(5, -1);
  }, { message: "Max value cannot be negative" });
});

test("ResourcePool - throws when current is negative", t => {
  t.throws(() => {
    new ResourcePool(-1, 10);
  }, { message: "Current value cannot be negative" });
});

test("ResourcePool - spend reduces current", t => {
  const pool = new ResourcePool(10, 10);
  const newPool = pool.spend(3);

  t.is(newPool.current, 7);
  t.is(newPool.max, 10);
  t.is(pool.current, 10); // Original unchanged
});

test("ResourcePool - spend throws on insufficient resources", t => {
  const pool = new ResourcePool(5, 10);

  t.throws(() => {
    pool.spend(6);
  }, { message: "Insufficient resources" });
});

test("ResourcePool - reduce clamps to zero", t => {
  const pool = new ResourcePool(5, 10);
  const newPool = pool.reduce(10);

  t.is(newPool.current, 0);
  t.is(newPool.max, 10);
});

test("ResourcePool - restore fills to max", t => {
  const pool = new ResourcePool(3, 10);
  const newPool = pool.restore();

  t.is(newPool.current, 10);
  t.is(newPool.max, 10);
});

test("ResourcePool - add increases current capped at max", t => {
  const pool = new ResourcePool(5, 10);
  const newPool = pool.add(10);

  t.is(newPool.current, 10);
  t.is(newPool.max, 10);
});

test("ResourcePool - isEmpty returns true when current is 0", t => {
  const pool = new ResourcePool(0, 10);

  t.true(pool.isEmpty());
});

test("ResourcePool - isFull returns true when current equals max", t => {
  const pool = new ResourcePool(10, 10);

  t.true(pool.isFull());
});

test("ResourcePool - getPercentage returns correct value", t => {
  const pool = new ResourcePool(5, 10);

  t.is(pool.getPercentage(), 50);
});

test("ResourcePool - create factory creates full pool", t => {
  const pool = ResourcePool.create(10);

  t.is(pool.current, 10);
  t.is(pool.max, 10);
});

test("ResourcePool - createEmpty factory creates empty pool", t => {
  const pool = ResourcePool.createEmpty(10);

  t.is(pool.current, 0);
  t.is(pool.max, 10);
});
