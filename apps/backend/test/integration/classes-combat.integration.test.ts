import test from "ava";

import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ClassesService } from "../../src/bounded-contexts/classes/application/classes.service.js";
import { ClassDefinitionService } from "../../src/bounded-contexts/classes/application/class-definition.service.js";
import { AptitudeService } from "../../src/bounded-contexts/aptitude/application/services/AptitudeService.js";
import { MongooseModule } from "@nestjs/mongoose";
import {
  ClassDefinition,
  ClassDefinitionSchema,
} from "../../src/bounded-contexts/classes/infrastructure/persistence/mongo/schemas/ClassDefinitionDocument.js";

let mongoServer: MongoMemoryServer;
let app: any;
let _classesService: ClassesService;
let classDefService: ClassDefinitionService;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  const moduleRef = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(mongoUri),
      MongooseModule.forFeature([{ name: ClassDefinition.name, schema: ClassDefinitionSchema }]),
    ],
    providers: [
      ClassesService,
      ClassDefinitionService,
      { provide: AptitudeService, useValue: { getByIds: async () => [] } },
    ],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  _classesService = moduleRef.get<ClassesService>(ClassesService);
  classDefService = moduleRef.get<ClassDefinitionService>(ClassDefinitionService);

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
