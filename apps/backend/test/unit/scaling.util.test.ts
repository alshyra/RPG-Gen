import test from "ava";
import {
  calculateMaxHP,
  calculateDamage,
  calculateHealing,
  getBasePA,
  getBasePM,
  calculateTotalPA,
  calculateTotalPM,
  getComputedStats,
  validateAptitudeCost,
  CLASS_STATS,
} from "../../src/bounded-contexts/combat/domain/scaling.util.js";

// =========================
// Class Stats Constants
// =========================

test("CLASS_STATS contains all 3 classes", t => {
  t.truthy(CLASS_STATS.guerrier, "guerrier exists");
  t.truthy(CLASS_STATS.rogue, "rogue exists");
  t.truthy(CLASS_STATS.mage, "mage exists");
});

test("CLASS_STATS has correct base values for guerrier", t => {
  const guerrier = CLASS_STATS.guerrier;
  t.is(guerrier.hp_base, 12);
  t.is(guerrier.hp_gain, 8);
  t.is(guerrier.pa, 6);
  t.is(guerrier.pm, 4);
  t.is(guerrier.main_stat, "vigor");
});

test("CLASS_STATS has correct base values for rogue", t => {
  const rogue = CLASS_STATS.rogue;
  t.is(rogue.hp_base, 10);
  t.is(rogue.hp_gain, 6);
  t.is(rogue.pa, 5);
  t.is(rogue.pm, 6);
  t.is(rogue.main_stat, "finesse");
});

test("CLASS_STATS has correct base values for mage", t => {
  const mage = CLASS_STATS.mage;
  t.is(mage.hp_base, 8);
  t.is(mage.hp_gain, 4);
  t.is(mage.pa, 5);
  t.is(mage.pm, 5);
  t.is(mage.main_stat, "mind");
});

// =========================
// HP Calculation
// =========================

test("calculateMaxHP for guerrier at level 1", t => {
  // PV_Max = 12 + (1 * 8) + (0 * 2) = 20
  const hp = calculateMaxHP("guerrier", 1, 0);
  t.is(hp, 20);
});

test("calculateMaxHP for guerrier at level 10", t => {
  // PV_Max = 12 + (10 * 8) + (0 * 2) = 92
  const hp = calculateMaxHP("guerrier", 10, 0);
  t.is(hp, 92);
});

test("calculateMaxHP with survival bonus", t => {
  // PV_Max = 12 + (5 * 8) + (3 * 2) = 12 + 40 + 6 = 58
  const hp = calculateMaxHP("guerrier", 5, 3);
  t.is(hp, 58);
});

test("calculateMaxHP for mage at level 1", t => {
  // PV_Max = 8 + (1 * 4) + (0 * 2) = 12
  const hp = calculateMaxHP("mage", 1, 0);
  t.is(hp, 12);
});

test("calculateMaxHP throws for unknown class", t => {
  t.throws(() => calculateMaxHP("unknown", 1, 0), { message: /Unknown class/ });
});

// =========================
// Damage Calculation
// =========================

test("calculateDamage at level 1 with no scaling", t => {
  // Damage = (5 + 0) * (1 + (1-1) * 0.15) = 5 * 1 = 5
  const damage = calculateDamage(5, null, { vigor: 0, finesse: 0, mind: 0, survival: 0 }, 1);
  t.is(damage, 5);
});

test("calculateDamage at level 1 with vigor scaling", t => {
  // Damage = (5 + 3) * (1 + (1-1) * 0.15) = 8 * 1 = 8
  const damage = calculateDamage(5, "vigor", { vigor: 3, finesse: 0, mind: 0, survival: 0 }, 1);
  t.is(damage, 8);
});

test("calculateDamage at level 5", t => {
  // Damage = (5 + 3) * (1 + (5-1) * 0.15) = 8 * 1.6 = 12.8 => 12
  const damage = calculateDamage(5, "vigor", { vigor: 3, finesse: 0, mind: 0, survival: 0 }, 5);
  t.is(damage, 12);
});

test("calculateDamage at level 10", t => {
  // Damage = (5 + 3) * (1 + (10-1) * 0.15) = 8 * 2.35 = 18.8 => 18
  const damage = calculateDamage(5, "vigor", { vigor: 3, finesse: 0, mind: 0, survival: 0 }, 10);
  t.is(damage, 18);
});

test("calculateDamage at level 20", t => {
  // Damage = (5 + 3) * (1 + (20-1) * 0.15) = 8 * 3.85 = 30.8 => 30
  const damage = calculateDamage(5, "vigor", { vigor: 3, finesse: 0, mind: 0, survival: 0 }, 20);
  t.is(damage, 30);
});

test("calculateDamage with finesse scaling for rogue", t => {
  // Damage = (4 + 4) * (1 + (3-1) * 0.15) = 8 * 1.3 = 10.4 => 10
  const damage = calculateDamage(4, "finesse", { vigor: 0, finesse: 4, mind: 0, survival: 0 }, 3);
  t.is(damage, 10);
});

test("calculateDamage with mind scaling for mage", t => {
  // Damage = (6 + 5) * (1 + (4-1) * 0.15) = 11 * 1.45 = 15.95 => 15
  const damage = calculateDamage(6, "mind", { vigor: 0, finesse: 0, mind: 5, survival: 0 }, 4);
  t.is(damage, 15);
});

// =========================
// Healing Calculation
// =========================

test("calculateHealing uses same formula as damage", t => {
  const heal = calculateHealing(5, "survival", { vigor: 0, finesse: 0, mind: 0, survival: 2 }, 3);
  // (5 + 2) * (1 + 2 * 0.15) = 7 * 1.3 = 9.1 => 9
  t.is(heal, 9);
});

// =========================
// PA/PM Calculations
// =========================

test("getBasePA returns correct values", t => {
  t.is(getBasePA("guerrier"), 6);
  t.is(getBasePA("rogue"), 5);
  t.is(getBasePA("mage"), 5);
});

test("getBasePM returns correct values", t => {
  t.is(getBasePM("guerrier"), 4);
  t.is(getBasePM("rogue"), 6);
  t.is(getBasePM("mage"), 5);
});

test("calculateTotalPA with equipment bonus", t => {
  t.is(calculateTotalPA("guerrier", 2), 8);
  t.is(calculateTotalPA("mage", 0), 5);
});

test("calculateTotalPM with equipment bonus", t => {
  t.is(calculateTotalPM("rogue", 1), 7);
  t.is(calculateTotalPM("mage", 0), 5);
});

// =========================
// getComputedStats
// =========================

test("getComputedStats returns complete stats object", t => {
  const stats = getComputedStats(
    "guerrier",
    5,
    { vigor: 3, finesse: 1, mind: 0, survival: 2 },
    { pa: 1, vigor: 1 },
  );

  t.is(stats.className, "guerrier");
  t.is(stats.level, 5);
  t.is(stats.paMax, 7); // 6 + 1
  t.is(stats.pmMax, 4); // 4 + 0
  t.is(stats.vigor, 4); // 3 + 1
  t.is(stats.finesse, 1);
  t.is(stats.mind, 0);
  t.is(stats.survival, 2);
  // HP = 12 + (5 * 8) + (2 * 2) = 12 + 40 + 4 = 56
  t.is(stats.hpMax, 56);
});

// =========================
// Validation
// =========================

test("validateAptitudeCost returns true when cost <= max PA", t => {
  t.true(validateAptitudeCost(4, "guerrier")); // 4 <= 6
  t.true(validateAptitudeCost(6, "guerrier")); // 6 <= 6
  t.true(validateAptitudeCost(5, "mage"));     // 5 <= 5
});

test("validateAptitudeCost returns false when cost > max PA", t => {
  t.false(validateAptitudeCost(7, "guerrier")); // 7 > 6
  t.false(validateAptitudeCost(6, "rogue"));    // 6 > 5
});
