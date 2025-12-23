import test from "ava";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongooseModule } from "@nestjs/mongoose";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import {
  ClassDefinition,
  ArchetypeSchema,
} from "../../src/bounded-contexts/archetype/infrastructure/persistence/mongo/schemas/ArchetypeDocument.js";

import { ArchetypeDefinitionService } from "../../src/bounded-contexts/archetype/application/archetype-definition.service.js";
import { ArchetypeService } from "../../src/bounded-contexts/archetype/application/archetype.service.js";
import { AptitudeService } from "../../src/bounded-contexts/aptitude/application/services/AptitudeService.js";

let mongoServer: MongoMemoryServer;
let classesService: ArchetypeService;
let classDefService: ArchetypeDefinitionService;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const moduleRef = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(uri),
      MongooseModule.forFeature([{ name: ClassDefinition.name, schema: ArchetypeSchema }]),
    ],
    providers: [
      ArchetypeService,
      ArchetypeDefinitionService,
      {
        provide: AptitudeService,
        useValue: { getByIds: async () => [] },
      },
    ],
  }).compile();

  classesService = moduleRef.get(ArchetypeService);
  classDefService = moduleRef.get(ArchetypeDefinitionService);
});

import mongoose from "mongoose";

test.after.always(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test.skip("All martial classes expose combatOptionsByLevel via getOptionsForLevel", async t => {
  const classes = ["barbarian", "fighter", "monk", "paladin", "ranger"];
  for (const cls of classes) {
    const path = join(__dirname, "..", "..", "src", "seed", "classes", cls, "levels.json");
    const raw = JSON.parse(readFileSync(path, "utf-8"));
    await classDefService.seedFromJson([raw]);
    // pick level 1 to inspect
    const opts = await classesService.getOptionsForLevel(raw.className, 1);
    t.truthy(opts.combatOptions && opts.combatOptions.length >= 0, `${cls} returns combatOptions`);
  }
});
