import test from "ava";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ClassesService } from "../../src/domain/classes/classes.service.js";
import { ClassDefinitionService } from "../../src/domain/class-definition/class-definition.service.js";
import { SpellDefinitionService } from "../../src/domain/spell-definition/spell-definition.service.js";
import { MongooseModule } from "@nestjs/mongoose";
import {
  ClassDefinition,
  ClassDefinitionSchema,
} from "../../src/infra/mongo/class/ClassDefinition.js";
import {
  SpellDefinition,
  SpellDefinitionSchema,
} from "../../src/infra/mongo/spell/SpellDefinition.js";

let mongoServer: MongoMemoryServer;
let app: INestApplication;
let classesService: ClassesService;
let classDefService: ClassDefinitionService;
let spellDefService: SpellDefinitionService;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  const moduleRef = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(mongoUri),
      MongooseModule.forFeature([
        { name: ClassDefinition.name, schema: ClassDefinitionSchema },
        { name: SpellDefinition.name, schema: SpellDefinitionSchema },
      ]),
    ],
    providers: [ClassesService, ClassDefinitionService, SpellDefinitionService],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  classesService = moduleRef.get<ClassesService>(ClassesService);
  classDefService = moduleRef.get<ClassDefinitionService>(ClassDefinitionService);
  spellDefService = moduleRef.get<SpellDefinitionService>(SpellDefinitionService);

  // Seed some test data
  await spellDefService.seedFromJson([
    {
      definitionId: "spell-0-assistance",
      name: "Assistance",
      level: 0,
      description: "You cast Assistance",
    },
    {
      definitionId: "spell-0-resistance",
      name: "Résistance",
      level: 0,
      description: "You cast Resistance",
    },
    {
      definitionId: "spell-1-benediction",
      name: "Bénédiction",
      level: 1,
      description: "You cast Bénédiction",
    },
  ]);

  await classDefService.seedFromJson([
    {
      className: "Cleric",
      hitDie: "1d8",
      primarySpellAbility: "Wisdom",
      description: "Test Cleric",
      levels: [
        {
          level: 1,
          proficiencyBonus: 2,
          cantripsKnown: 2,
          spellsKnown: 2,
          features: [],
          choices: [],
          unlockedSpells: [],
        },
      ],
      allowedSpellsByLevel: {
        "0": [
          { name: "Assistance", definitionId: "spell-0-assistance" },
          { name: "Résistance", definitionId: "spell-0-resistance" },
        ],
        "1": [{ name: "Bénédiction", definitionId: "spell-1-benediction" }],
      },
    },
  ]);
});

test.after(async () => {
  await app.close();
  await mongoServer.stop();
});

test.skip("getOptionsForLevel should return unlockedSpells for Cleric level 1", async t => {
  const options = await classesService.getOptionsForLevel("Cleric", 1);

  t.is(options.className, "Cleric");
  t.is(options.nextLevel, 1);
  t.is(options.cantripsKnown, 2);
  t.is(options.spellsKnown, 2);

  // Should have spells from level 0 and 1
  t.is(
    options.unlockedSpells.length,
    3,
    "Should have 3 unlocked spells (2 from level 0, 1 from level 1)",
  );

  // Verify spell structure
  const assistanceSpell = options.unlockedSpells.find(s => s.definitionId === "spell-0-assistance");
  t.truthy(assistanceSpell, "Should have Assistance spell");
  t.is(assistanceSpell?.name, "Assistance");
  t.is(assistanceSpell?.level, 0);

  const blessSpell = options.unlockedSpells.find(s => s.definitionId === "spell-1-benediction");
  t.truthy(blessSpell, "Should have Bénédiction spell");
  t.is(blessSpell?.level, 1);
});
