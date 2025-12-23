import test from "ava";
import { ClassesService } from "../../src/bounded-contexts/classes/application/classes.service.js";

// Mock ClassDefinitionService
function makeMockClassDefService() {
  return {
    findByName: async (_name: string) => null,
    findByNameOrThrow: async (_name: string) => {
      throw new Error("Not found");
    },
    findAll: async () => [],
  } as any;
}

test("ClassesService.getAllClasses returns empty array with mock", async t => {
  const classDefService = makeMockClassDefService();
  const service = new ClassesService(classDefService);

  const classes = await service.getAllClasses();
  t.deepEqual(classes, []);
});

test("ClassesService.getTalentTrees returns empty array when class has no trees", async t => {
  const classDefService = {
    findByNameOrThrow: async (_name: string) => ({
      name: "Guerrier",
      baseStats: { hp_base: 12, pa: 6, pm: 4 },
      talentTrees: null,
    }),
    findAll: async () => [],
  } as any;

  const service = new ClassesService(classDefService);
  const trees = await service.getTalentTrees("Guerrier");
  t.deepEqual(trees, []);
});
