import test from "ava";

import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ArchetypeService } from "../../src/bounded-contexts/archetype/application/archetype.service.js";
import { ArchetypeDefinitionService } from "../../src/bounded-contexts/archetype/application/archetype-definition.service.js";
import { AptitudeService } from "../../src/bounded-contexts/aptitude/application/services/AptitudeService.js";
import { MongooseModule } from "@nestjs/mongoose";
import {
  ClassDefinition,
  ArchetypeSchema,
} from "../../src/bounded-contexts/archetype/infrastructure/persistence/mongo/schemas/ArchetypeDocument.js";

let mongoServer: MongoMemoryServer;
let app: any;
let _classesService: ArchetypeService;
let classDefService: ArchetypeDefinitionService;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  const moduleRef = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(mongoUri),
      MongooseModule.forFeature([{ name: ClassDefinition.name, schema: ArchetypeSchema }]),
    ],
    providers: [
      ArchetypeService,
      ArchetypeDefinitionService,
      { provide: AptitudeService, useValue: { getByIds: async () => [] } },
    ],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  _classesService = moduleRef.get<ArchetypeService>(ArchetypeService);
  classDefService = moduleRef.get<ArchetypeDefinitionService>(ArchetypeDefinitionService);

  // Seed a Rogue with combat options
  await classDefService.seedFromJson([
    {
      name: "Rogue",
      baseStats: {
        hp_base: 8,
        pa: 8,
        pm: 6,
      },
      startingAptitudes: [],
    },
  ]);
});

test.after(async () => {
  await app.close();
  await mongoServer.stop();
});

test.skip("getOptionsForLevel returns combat options for Rogue", async t => {
  const persisted = await classDefService.findByName("Rogue");
  t.truthy(persisted, "persisted class");
  t.truthy(persisted?.displayName || persisted?.name, "class persisted");

  // This test is skipped as combatOptionsByLevel was part of old schema
});
