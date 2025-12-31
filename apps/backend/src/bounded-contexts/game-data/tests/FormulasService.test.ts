import { FormulasService } from "../application/services/FormulasService.js";

describe("FormulasService", () => {
  let service: FormulasService;

  beforeEach(async () => {
    service = new FormulasService();
    await service.onModuleInit();
  });

  describe("calculateDamage", () => {
    test("calculates damage with basePower and scaling at level 1", () => {
      // Formula: (basePower + scalingStatValue) * levelMultiplier
      // At level 1: levelMultiplier = 1.0 + (1-1) * 0.15 = 1.0
      const damage = service.calculateDamage(5, 3, 1);
      // (5 + 3) * 1.0 = 8
      expect(damage).toBe(8);
    });

    test("calculates damage with level scaling", () => {
      // At level 5: levelMultiplier = 1.0 + (5-1) * 0.15 = 1.6
      const damage = service.calculateDamage(5, 3, 5);
      // (5 + 3) * 1.6 = 12.8 -> 12 (floored)
      expect(damage).toBe(12);
    });

    test("calculates damage for Désintégration aptitude (basePower 8, mind scaling)", () => {
      // Désintégration: basePower=8, scaling=mind
      // Assuming character has 6 mind, level 3
      // levelMultiplier = 1.0 + (3-1) * 0.15 = 1.3
      const basePower = 8;
      const mindStat = 6;
      const level = 3;
      const damage = service.calculateDamage(basePower, mindStat, level);
      // (8 + 6) * 1.3 = 18.2 -> 18
      expect(damage).toBe(18);
    });

    test("calculates damage for Embuscade aptitude (basePower 6, finesse scaling)", () => {
      // Embuscade: basePower=6, scaling=finesse
      // Assuming rogue with 8 finesse, level 2
      // levelMultiplier = 1.0 + (2-1) * 0.15 = 1.15
      const basePower = 6;
      const finesseStat = 8;
      const level = 2;
      const damage = service.calculateDamage(basePower, finesseStat, level);
      // (6 + 8) * 1.15 = 16.1 -> 16
      expect(damage).toBe(16);
    });

    test("returns 0 damage when basePower is 0", () => {
      const damage = service.calculateDamage(0, 5, 1);
      // (0 + 5) * 1.0 = 5
      expect(damage).toBe(5);
    });

    test("handles zero scaling stat", () => {
      const damage = service.calculateDamage(10, 0, 1);
      // (10 + 0) * 1.0 = 10
      expect(damage).toBe(10);
    });
  });

  describe("calculateHealing", () => {
    test("calculates healing same as damage formula", () => {
      // Souffle de Vie: basePower=6, scaling=mind
      const basePower = 6;
      const mindStat = 5;
      const level = 1;
      const healing = service.calculateHealing(basePower, mindStat, level);
      // (6 + 5) * 1.0 = 11
      expect(healing).toBe(11);
    });

    test("calculates healing with level scaling", () => {
      const healing = service.calculateHealing(6, 5, 4);
      // levelMultiplier = 1.0 + (4-1) * 0.15 = 1.45
      // (6 + 5) * 1.45 = 15.95 -> 15
      expect(healing).toBe(15);
    });
  });

  describe("calculateMaxHP", () => {
    test("calculates HP at level 1 with no survival", () => {
      // Formula: hpBase + (level * hpGain) + (survival * survivalBonus)
      // survivalBonus = 2 (from formulas.json)
      const hp = service.calculateMaxHP(12, 8, 1, 0);
      // 12 + (1 * 8) + (0 * 2) = 20
      expect(hp).toBe(20);
    });

    test("calculates HP at higher level", () => {
      const hp = service.calculateMaxHP(12, 8, 5, 0);
      // 12 + (5 * 8) + (0 * 2) = 52
      expect(hp).toBe(52);
    });

    test("calculates HP with survival bonus", () => {
      const hp = service.calculateMaxHP(12, 8, 1, 5);
      // 12 + (1 * 8) + (5 * 2) = 30
      expect(hp).toBe(30);
    });

    test("calculates guerrier HP (hpBase=12, hpGain=10)", () => {
      // Guerrier at level 3 with 6 survival
      const hp = service.calculateMaxHP(12, 10, 3, 6);
      // 12 + (3 * 10) + (6 * 2) = 54
      expect(hp).toBe(54);
    });

    test("calculates mage HP (hpBase=8, hpGain=4)", () => {
      // Mage at level 5 with 4 survival
      const hp = service.calculateMaxHP(8, 4, 5, 4);
      // 8 + (5 * 4) + (4 * 2) = 36
      expect(hp).toBe(36);
    });
  });

  describe("rollInitiative", () => {
    test("returns a value between finesse and finesse + 20", () => {
      const finesse = 5;
      // Roll d20 (1-20) + finesse
      // Result should be between 1+5=6 and 20+5=25
      const results = Array.from({ length: 100 }, () => 
        service.rollInitiative(finesse)
      );
      
      results.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(1 + finesse);
        expect(result).toBeLessThanOrEqual(20 + finesse);
      });
    });
  });

  describe("getEnemyDefaults", () => {
    test("returns default enemy values from formulas.json", () => {
      const defaults = service.getEnemyDefaults();
      
      expect(defaults.basePower).toBe(5);
      expect(defaults.level).toBe(1);
      expect(defaults.scalingAttribute).toBe("vigor");
      expect(defaults.stats.vigor).toBe(2);
      expect(defaults.stats.finesse).toBe(2);
      expect(defaults.stats.mind).toBe(2);
      expect(defaults.stats.survival).toBe(2);
      expect(defaults.pa).toBe(1);
    });
  });

  describe("getFormulas", () => {
    test("returns all game formulas", () => {
      const formulas = service.getFormulas();
      
      expect(formulas.combat.damage.levelMultiplierBase).toBe(1.0);
      expect(formulas.combat.damage.levelMultiplierGrowth).toBe(0.15);
      expect(formulas.character.hp.survivalBonus).toBe(2);
      expect(formulas.character.initiative.baseDie).toBe(20);
      expect(formulas.aptitude.power.scalingDivisor).toBe(2);
    });
  });
});
