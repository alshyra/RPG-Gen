import test from "ava";
import { NotFoundException } from "@nestjs/common";
import { TalentTreeService } from "../../src/domain/talent-tree/talent-tree.service.js";
import { TalentTree, TalentRank } from "../../src/bounded-contexts/classes/infrastructure/persistence/mongo/schemas/index.js";

// Mock model factory
const createMockClassDefinitionModel = () => {
  const mockClasses: any[] = [];

  return {
    findOne: (filter: any) => ({
      exec: async () => mockClasses.find(c => c.name === filter.name) || null,
    }),
  };
};

const mockTalentRank1: TalentRank = {
  rank: 1,
  aptitudeId: "aura_devotion",
  pointCost: 1,
};

const mockVoie: TalentTree = {
  name: "Voie de la Lumière",
  ranks: [mockTalentRank1],
};

const mockClassDef = {
  name: "guerrier",
  displayName: "Guerrier",
  baseStats: {
    hp_base: 12,
    pa: 6,
    pm: 4,
  },
  talentTrees: {
    lumiere: mockVoie,
  },
};

test("TalentTreeService - calculateTalentPointsForRank at rank 1", t => {
  const mockModel = createMockClassDefinitionModel();
  const service = new TalentTreeService(mockModel as any);
  
  const points = service.calculateTalentPointsForRank(mockVoie, 1);
  t.is(points, 1);
});

test("TalentTreeService - calculateTalentPointsForRank throws for invalid rank", t => {
  const mockModel = createMockClassDefinitionModel();
  const service = new TalentTreeService(mockModel as any);
  
  t.throws(() => service.calculateTalentPointsForRank(mockVoie, 0));
  t.throws(() => service.calculateTalentPointsForRank(mockVoie, 6));
});

test("TalentTreeService - validateRankUnlock allows consecutive rank", async t => {
  const mockModel = createMockClassDefinitionModel();
  const service = new TalentTreeService(mockModel as any);
  
  const valid = await service.validateRankUnlock("guerrier", "lumiere", 1, 0);
  t.true(valid);
});

test("TalentTreeService - validateRankUnlock rejects skipped rank", async t => {
  const mockModel = createMockClassDefinitionModel();
  const service = new TalentTreeService(mockModel as any);
  
  const valid = await service.validateRankUnlock("guerrier", "lumiere", 3, 1);
  t.false(valid);
});

test("TalentTreeService - getVoiesByClass throws when class not found", async t => {
  const mockModel = createMockClassDefinitionModel();
  const service = new TalentTreeService(mockModel as any);
  
  await t.throwsAsync(() => service.getVoiesByClass("nonexistent"), {
    instanceOf: NotFoundException,
  });
});

test("TalentTreeService - getVoiesByClass returns voies for valid class", async t => {
  const mockModel = createMockClassDefinitionModel();
  (mockModel as any).findOne = (filter: any) => ({
    exec: async () => (filter.name === "guerrier" ? mockClassDef : null),
  });
  
  const service = new TalentTreeService(mockModel as any);
  const voies = await service.getVoiesByClass("guerrier");
  
  t.is(voies.length, 1);
  t.is(voies[0].name, "Voie de la Lumière");
});
