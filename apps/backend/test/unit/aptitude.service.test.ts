import test from "ava";
import { AptitudeService } from "../../src/bounded-contexts/aptitude/application/services/AptitudeService.js";

// Mock Model simplifié pour le contexte
const createMockAptitudeModel = () => {
  const mockDocs: any[] = [];
  return {
    findOne: (_filter: any) => ({
      exec: async () => mockDocs.find(d => d.aptitudeId === _filter.aptitudeId) || null,
    }),
    find: (_filter: any) => ({
      exec: async () => mockDocs,
    }),
    findOneAndUpdate: async (filter: any, update: any) => {
      const newDoc = { ...filter, ...update };
      mockDocs.push(newDoc);
      return newDoc;
    },
  };
};

/**
 * TESTS DE PROGRESSION (PALIER DE PROFICIENCY)
 * Formule attendue : basePower + proficiencyBonus(level)
 * Paliers : 1-3 (+3), 4-6 (+5), 7-9 (+7), 10+ (+10)
 */

test("AptitudeService - calculateScaledPower au niveau 1 (Palier +3)", t => {
  const mockModel = createMockAptitudeModel();
  const service = new AptitudeService(mockModel as any);
  
  // Base 5 + Prof 3 = 8
  const power = service.calculateScaledPower(5, 1);
  t.is(power, 8); 
});

test("AptitudeService - calculateScaledPower au niveau 5 (Palier +5)", t => {
  const mockModel = createMockAptitudeModel();
  const service = new AptitudeService(mockModel as any);
  
  // Base 5 + Prof 5 = 10
  const power = service.calculateScaledPower(5, 5);
  t.is(power, 10);
});

test("AptitudeService - calculateScaledPower au niveau 8 (Palier +7)", t => {
  const mockModel = createMockAptitudeModel();
  const service = new AptitudeService(mockModel as any);
  
  // Base 5 + Prof 7 = 12
  const power = service.calculateScaledPower(5, 8);
  t.is(power, 12);
});

test("AptitudeService - calculateScaledPower au niveau 10 (Palier +10)", t => {
  const mockModel = createMockAptitudeModel();
  const service = new AptitudeService(mockModel as any);
  
  // Base 5 + Prof 10 = 15
  const power = service.calculateScaledPower(5, 10);
  t.is(power, 15);
});

/**
 * TESTS FONCTIONNELS
 */

test("AptitudeService - getById retourne l'aptitude avec les bonnes data", async t => {
  const mockModel = createMockAptitudeModel();
  const service = new AptitudeService(mockModel as any);
  
  const mockAptitude = {
    aptitudeId: "fireball",
    name: "Boule de Feu",
    basePower: 10
  };

  await mockModel.findOneAndUpdate({ aptitudeId: "fireball" }, mockAptitude);
  
  const result = await service.getById("fireball");
  t.truthy(result);
  t.is(result?.name, "Boule de Feu");
});

test("AptitudeService - toResponseDto mappe correctement les champs", t => {
  const mockModel = createMockAptitudeModel();
  const service = new AptitudeService(mockModel as any);
  
  const entity = {
    aptitudeId: "slash",
    name: "Entaille",
    description: "Une attaque tranchante de base",
    paCost: 2,
    cooldown: 0,
    targetType: "enemy",
    range: 1,
    category: "attack",
    basePower: 5
  };
  
  const dto = service.toResponseDto(entity as any);
  t.is(dto.aptitudeId, "slash");
  t.is(dto.paCost, 2);
  t.is(dto.description, "Une attaque tranchante de base");
  t.is(dto.cooldown, 0);
  t.is(dto.targetType, "enemy");
});