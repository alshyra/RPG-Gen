/**
 * Integration tests for aptitude damage calculations.
 * Verifies that specific aptitudes (Désintégration, Embuscade) 
 * use their basePower correctly in damage calculations.
 * 
 * These tests load aptitudes directly from seed JSON files and verify
 * that FormulasService applies the correct damage calculations.
 */
import { FormulasService } from "../application/services/FormulasService.js";
import { Aptitude, type ScalingStat, type TargetType, type EffectType, type AreaShape } from "../domain/aptitude/entities/Aptitude.js";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AptitudeSeedData {
  id: string;
  name: string;
  paCost?: number;
  cooldown?: number;
  targetType?: TargetType;
  range?: number;
  basePower?: number;
  scaling?: ScalingStat;
  effectType?: EffectType;
  area?: AreaShape;
  descriptionForAi?: string;
}

describe("Aptitude Damage Integration", () => {
  let formulasService: FormulasService;
  let aptitudes: Map<string, Aptitude>;

  beforeAll(async () => {
    formulasService = new FormulasService();
    await formulasService.onModuleInit();
    
    // Load aptitudes directly from seed file
    const aptitudesPath = join(__dirname, "../assets/aptitudes.json");
    const content = await readFile(aptitudesPath, "utf-8");
    const aptitudeData: AptitudeSeedData[] = JSON.parse(content);
    
    aptitudes = new Map();
    aptitudeData.forEach(data => {
      aptitudes.set(data.id, Aptitude.fromSeedData(data));
    });
  });

  function getAptitude(id: string): Aptitude {
    const apt = aptitudes.get(id);
    if (!apt) throw new Error(`Aptitude ${id} not found in seed data`);
    return apt;
  }

  describe("Désintégration (mag_desintegration)", () => {
    test("has basePower of 8 and scales with mind", () => {
      const aptitude = getAptitude("mag_desintegration");
      
      expect(aptitude.basePower).toBe(8);
      expect(aptitude.scaling).toBe("mind");
    });

    test("calculates correct damage with mind scaling", () => {
      const aptitude = getAptitude("mag_desintegration");
      
      // Mage with 7 mind at level 3
      const mindStat = 7;
      const level = 3;      
      const actualDamage = formulasService.calculateDamage(
        aptitude.basePower,
        mindStat,
        level
      );
        
      // levelMultiplier = 1.0 + (3-1) * 0.15 = 1.3
      // damage = (8 + 7) * 1.3 = 19.5 -> 19
      expect(actualDamage).toBe(19);
    });

    test("high-level mage deals significantly more damage", () => {
      const aptitude = getAptitude("mag_desintegration");
      
      // High-level mage: 10 mind, level 10
      const mindStat = 10;
      const level = 10;
      // levelMultiplier = 1.0 + (10-1) * 0.15 = 2.35
      // damage = (8 + 10) * 2.35 = 42.3 -> 42
      const damage = formulasService.calculateDamage(
        aptitude.basePower,
        mindStat,
        level
      );
      
      expect(damage).toBe(42);
    });
  });

  describe("Embuscade (rog_embuscade)", () => {
    test("has basePower of 6 and scales with finesse", () => {
      const aptitude = getAptitude("rog_embuscade");
      
      expect(aptitude.basePower).toBe(6);
      expect(aptitude.scaling).toBe("finesse");
    });

    test("calculates correct damage with finesse scaling", () => {
      const aptitude = getAptitude("rog_embuscade");
      
      // Rogue with 8 finesse at level 2
      const finesseStat = 8;
      const level = 2;
      
      const actualDamage = formulasService.calculateDamage(
          aptitude.basePower,
          finesseStat,
          level
        );
        
      // levelMultiplier = 1.0 + (2-1) * 0.15 = 1.15
      // damage = (6 + 8) * 1.15 = 16.1 -> 16
      expect(actualDamage).toBe(16);
    });

    test("rogue with high finesse deals more damage than low finesse", () => {
      const aptitude = getAptitude("rog_embuscade");
      
      const level = 5;
      
      // Low finesse rogue: 4 finesse
      const lowFinesseDamage = formulasService.calculateDamage(
        aptitude.basePower,
        4,
        level
      );
      
      // High finesse rogue: 10 finesse
      const highFinesseDamage = formulasService.calculateDamage(
        aptitude.basePower,
        10,
        level
      );
      
      expect(highFinesseDamage).toBeGreaterThan(lowFinesseDamage);
    });
  });

  describe("Frappe Simple (frappe_simple)", () => {
    test("has basePower of 3 and scales with vigor", () => {
      const aptitude = getAptitude("frappe_simple");
      
      expect(aptitude.basePower).toBe(3);
      expect(aptitude.scaling).toBe("vigor");
    });

    test("basic attack damage is lower than specialized abilities", () => {
      const frappeSimple = getAptitude("frappe_simple");
      const embuscade = getAptitude("rog_embuscade");
      const desintegration = getAptitude("mag_desintegration");
      
      // Same level, same stat value
      const statValue = 6;
      const level = 3;
      
      const frappeDamage = formulasService.calculateDamage(frappeSimple.basePower, statValue, level);
      const embuscadeDamage = formulasService.calculateDamage(embuscade.basePower, statValue, level);
      const desintegrationDamage = formulasService.calculateDamage(desintegration.basePower, statValue, level);
      
      // Frappe Simple (basePower 3) should be lowest
      expect(frappeDamage).toBeLessThan(embuscadeDamage);
      expect(frappeDamage).toBeLessThan(desintegrationDamage);
      
      // Désintégration (basePower 8) should be highest
      expect(desintegrationDamage).toBeGreaterThan(embuscadeDamage);
    });
  });

  describe("Souffle de Vie (mag_souffle_vie) - Healing", () => {
    test("has basePower of 6 and scales with mind", () => {
      const aptitude = getAptitude("mag_souffle_vie");
      
      expect(aptitude.basePower).toBe(6);
      expect(aptitude.scaling).toBe("mind");
      expect(aptitude.effectType).toBe("heal");
    });

    test("calculates correct healing with mind scaling", () => {
      const aptitude = getAptitude("mag_souffle_vie");
      
      // Healer with 7 mind at level 4
      const mindStat = 7;
      const level = 4;
      // levelMultiplier = 1.0 + (4-1) * 0.15 = 1.45
      // healing = (6 + 7) * 1.45 = 18.85 -> 18
      const healing = formulasService.calculateHealing(
        aptitude.basePower,
        mindStat,
        level
      );
      
      expect(healing).toBe(18);
    });
  });

  describe("Tempête Arcanique (mag_tempete_arcanique) - High Power AoE", () => {
    test("has basePower of 7 and scales with mind", () => {
      const aptitude = getAptitude("mag_tempete_arcanique");
      
      expect(aptitude.basePower).toBe(7);
      expect(aptitude.scaling).toBe("mind");
      expect(aptitude.area).toBe("circle_3");
    });

    test("deals significant damage at high level", () => {
      const aptitude = getAptitude("mag_tempete_arcanique");
      
      // High-level mage: 9 mind, level 8
      const mindStat = 9;
      const level = 8;
      // levelMultiplier = 1.0 + (8-1) * 0.15 = 2.05
      // damage = (7 + 9) * 2.05 = 32.8 -> 32
      const damage = formulasService.calculateDamage(
        aptitude.basePower,
        mindStat,
        level
      );
      
      expect(damage).toBe(32);
    });
  });
});
