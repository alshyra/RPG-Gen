import test from "ava";
import { ProgressionService } from "../../src/domain/progression/progression.service.js";

const createMockCharacterModel = () => {
  const mockDocs: any[] = [];

  return class MockModel {
    constructor(data: any) {
      this.data = data;
    }

    data: any;

    async save() {
      mockDocs.push(this.data);
      return this.data;
    }

    static async findOne(filter: any) {
      return {
        exec: async () => {
          const doc = mockDocs.find(d => d.userId === filter.userId && d.characterId === filter.characterId);
          if (!doc) return null;
          return {
            ...doc,
            save: async function () {
              return this;
            },
          };
        },
      };
    }

    static mockDocs = mockDocs;
  };
};

const createMockClassDefService = () => ({
  findByName: async (name: string) => {
    const classes: Record<string, any> = {
      guerrier: {
        name: "guerrier",
        baseStats: { hp_base: 12, pa: 6, pm: 4 },
        proficiencies: ["vigor", "survival"],
        startingAptitudes: ["frappe_simple", "posture_defensive"],
        talentTrees: {
          protection: {
            name: "Voie de la Protection",
            ranks: [
              { rank: 1, aptitudeId: "bouclier_heroique", pointCost: 1 },
              { rank: 2, aptitudeId: "mur_de_fer", pointCost: 1 },
            ],
          },
        },
      },
    };
    return classes[name] || null;
  },
});

const createMockItemDefService = () => ({
  findByDefinitionId: async (id: string) => ({
    definitionId: id,
    name: "Mock Item",
    bonuses: {},
  }),
});

test("getAvailableClasses returns 3 classes", t => {
  const mockCharModel = createMockCharacterModel();
  const mockClassDefService = createMockClassDefService();
  const mockItemDefService = createMockItemDefService();

  const service = new ProgressionService(
    mockCharModel as any,
    mockItemDefService as any,
    mockClassDefService as any,
  );

  const classes = service.getAvailableClasses();
  t.is(classes.length, 3, "Should have 3 classes");
  t.deepEqual(
    classes.map(c => c.name),
    ["guerrier", "rogue", "mage"],
  );
});

test("getAvailableClasses includes correct metadata", t => {
  const mockCharModel = createMockCharacterModel();
  const mockClassDefService = createMockClassDefService();
  const mockItemDefService = createMockItemDefService();

  const service = new ProgressionService(
    mockCharModel as any,
    mockItemDefService as any,
    mockClassDefService as any,
  );

  const classes = service.getAvailableClasses();
  const guerrier = classes.find(c => c.name === "guerrier");

  t.truthy(guerrier, "Guerrier class should exist");
  t.is(guerrier!.displayName, "Guerrier");
  t.is(guerrier!.baseStats.hp, 12);
  t.is(guerrier!.baseStats.pa, 6);
  t.is(guerrier!.baseStats.pm, 4);
});
