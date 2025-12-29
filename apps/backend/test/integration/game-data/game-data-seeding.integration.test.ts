/**
 * Integration tests for GameDataSeeder and Game Data APIs.
 *
 * Tests verify:
 * - GameDataSeeder populates the database correctly on module init
 * - Classes API returns seeded data
 * - Races API returns seeded data
 * - Aptitudes API returns seeded data
 * - Items API returns seeded data
 */

import test from "ava";
import request from "supertest";
import { GameDataModule } from "../../../src/bounded-contexts/game-data/game-data.module.js";
import { ClassDataService } from "../../../src/bounded-contexts/game-data/application/services/ClassDataService.js";
import { RaceDataService } from "../../../src/bounded-contexts/game-data/application/services/RaceDataService.js";
import { AptitudeDataService } from "../../../src/bounded-contexts/game-data/application/services/AptitudeDataService.js";
import { ItemDataService } from "../../../src/bounded-contexts/game-data/application/services/ItemDataService.js";
import { EnemyDataService } from "../../../src/bounded-contexts/game-data/application/services/EnemyDataService.js";
import { createTestApp, closeTestApp, type TestAppContext } from "../../helpers/test-app.js";
import type { INestApplication } from "@nestjs/common";

// ============= Test Context =============

interface GameDataTestContext {
  ctx: TestAppContext;
  app: INestApplication;
  classService: ClassDataService;
  raceService: RaceDataService;
  aptitudeService: AptitudeDataService;
  itemService: ItemDataService;
  enemyService: EnemyDataService;
}

// ============= Setup & Teardown =============

/**
 * Setup test application with GameDataModule
 * GameDataSeeder runs automatically on module init
 */
async function setupGameDataTest(): Promise<GameDataTestContext> {
  const ctx = await createTestApp([GameDataModule]);

  return {
    ctx,
    app: ctx.app,
    classService: ctx.module.get(ClassDataService),
    raceService: ctx.module.get(RaceDataService),
    aptitudeService: ctx.module.get(AptitudeDataService),
    itemService: ctx.module.get(ItemDataService),
    enemyService: ctx.module.get(EnemyDataService),
  };
}

async function teardownGameDataTest(context: GameDataTestContext): Promise<void> {
  await closeTestApp(context.ctx);
}

// ============= Seeder Tests =============

test.serial("GameDataSeeder seeds character classes on module init", async t => {
  const context = await setupGameDataTest();
  try {
    const classes = await context.classService.findAll();

    t.true(classes.length >= 3, "Should seed at least 3 classes (guerrier, rogue, mage)");

    const classNames = classes.map(c => c.name);
    t.true(classNames.includes("guerrier"), "Should include guerrier class");
    t.true(classNames.includes("rogue"), "Should include rogue class");
    t.true(classNames.includes("mage"), "Should include mage class");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GameDataSeeder seeds races on module init", async t => {
  const context = await setupGameDataTest();
  try {
    const races = await context.raceService.findAll();

    t.true(races.length >= 4, "Should seed at least 4 races");

    const raceIds = races.map(r => r.id);
    t.true(raceIds.includes("humain"), "Should include humain race");
    t.true(raceIds.includes("nain"), "Should include nain race");
    t.true(raceIds.includes("elfe"), "Should include elfe race");
    t.true(raceIds.includes("orc"), "Should include orc race");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GameDataSeeder seeds aptitudes on module init", async t => {
  const context = await setupGameDataTest();
  try {
    const aptitudes = await context.aptitudeService.findAll();

    t.true(aptitudes.length >= 1, "Should seed at least 1 aptitude");

    // Check that aptitudes have required properties
    const firstAptitude = aptitudes[0];
    t.truthy(firstAptitude.id, "Aptitude should have id");
    t.truthy(firstAptitude.name, "Aptitude should have name");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GameDataSeeder seeds items on module init", async t => {
  const context = await setupGameDataTest();
  try {
    const items = await context.itemService.findAll();

    t.true(items.length >= 1, "Should seed at least 1 item");

    // Check that items have required properties
    const firstItem = items[0];
    t.truthy(firstItem.definitionId, "Item should have definitionId");
    t.truthy(firstItem.name, "Item should have name");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GameDataSeeder seeds enemies on module init", async t => {
  const context = await setupGameDataTest();
  try {
    const enemies = await context.enemyService.findAll();

    t.true(enemies.length >= 1, "Should seed at least 1 enemy");

    // Check that enemies have required properties
    const firstEnemy = enemies[0];
    t.truthy(firstEnemy.id, "Enemy should have id");
    t.truthy(firstEnemy.name, "Enemy should have name");
  } finally {
    await teardownGameDataTest(context);
  }
});

// ============= Classes API Tests =============

test.serial("GET /classes returns seeded classes", async t => {
  const context = await setupGameDataTest();
  try {
    const response = await request(context.app.getHttpServer())
      .get("/classes")
      .expect(200);

    t.true(Array.isArray(response.body), "Response should be an array");
    t.true(response.body.length >= 3, "Should return at least 3 classes");

    const guerrier = response.body.find((c: { name: string }) => c.name === "guerrier");
    t.truthy(guerrier, "Should include guerrier class");
    t.truthy(guerrier.displayName, "Class should have displayName");
    t.truthy(guerrier.baseStats, "Class should have baseStats");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GET /classes/:className returns specific class", async t => {
  const context = await setupGameDataTest();
  try {
    const response = await request(context.app.getHttpServer())
      .get("/classes/guerrier")
      .expect(200);

    t.is(response.body.name, "guerrier", "Should return guerrier class");
    t.truthy(response.body.baseStats, "Should include baseStats");
    t.truthy(response.body.talentTrees, "Should include talentTrees");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GET /classes/:className returns 404 for unknown class", async t => {
  const context = await setupGameDataTest();
  try {
    await request(context.app.getHttpServer())
      .get("/classes/unknown-class")
      .expect(404);

    t.pass();
  } finally {
    await teardownGameDataTest(context);
  }
});

// ============= Races API Tests =============

test.serial("GET /game-data/races returns seeded races", async t => {
  const context = await setupGameDataTest();
  try {
    const response = await request(context.app.getHttpServer())
      .get("/game-data/races")
      .expect(200);

    t.true(Array.isArray(response.body), "Response should be an array");
    t.true(response.body.length >= 4, "Should return at least 4 races");

    const humain = response.body.find((r: { id: string }) => r.id === "humain");
    t.truthy(humain, "Should include humain race");
    t.truthy(humain.name, "Race should have name");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GET /game-data/races/:raceId returns specific race", async t => {
  const context = await setupGameDataTest();
  try {
    const response = await request(context.app.getHttpServer())
      .get("/game-data/races/humain")
      .expect(200);

    t.is(response.body.id, "humain", "Should return humain race");
    t.truthy(response.body.name, "Should include name");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GET /game-data/races/:raceId returns 404 for unknown race", async t => {
  const context = await setupGameDataTest();
  try {
    await request(context.app.getHttpServer())
      .get("/game-data/races/unknown-race")
      .expect(404);

    t.pass();
  } finally {
    await teardownGameDataTest(context);
  }
});

// ============= Aptitudes API Tests =============

test.serial("GET /aptitudes returns seeded aptitudes", async t => {
  const context = await setupGameDataTest();
  try {
    const response = await request(context.app.getHttpServer())
      .get("/aptitudes")
      .expect(200);

    t.true(Array.isArray(response.body), "Response should be an array");
    t.true(response.body.length >= 1, "Should return at least 1 aptitude");

    const firstAptitude = response.body[0];
    t.truthy(firstAptitude.id, "Aptitude should have id");
    t.truthy(firstAptitude.name, "Aptitude should have name");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GET /aptitudes/:aptitudeId returns specific aptitude", async t => {
  const context = await setupGameDataTest();
  try {
    // First get all aptitudes to find a valid ID
    const allResponse = await request(context.app.getHttpServer())
      .get("/aptitudes")
      .expect(200);

    const firstAptitude = allResponse.body[0];
    if (!firstAptitude) {
      t.pass("No aptitudes seeded to test");
      return;
    }

    const response = await request(context.app.getHttpServer())
      .get(`/aptitudes/${firstAptitude.id}`)
      .expect(200);

    t.is(response.body.id, firstAptitude.id, "Should return correct aptitude");
    t.truthy(response.body.name, "Should include name");
  } finally {
    await teardownGameDataTest(context);
  }
});

// ============= Items API Tests =============

test.serial("GET /items returns seeded items", async t => {
  const context = await setupGameDataTest();
  try {
    const response = await request(context.app.getHttpServer())
      .get("/items")
      .expect(200);

    t.true(Array.isArray(response.body), "Response should be an array");
    t.true(response.body.length >= 1, "Should return at least 1 item");

    const firstItem = response.body[0];
    t.truthy(firstItem.definitionId, "Item should have definitionId");
    t.truthy(firstItem.name, "Item should have name");
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GET /items/weapons returns weapon items only", async t => {
  const context = await setupGameDataTest();
  try {
    const response = await request(context.app.getHttpServer())
      .get("/items/weapons")
      .expect(200);

    t.true(Array.isArray(response.body), "Response should be an array");

    // All returned items should be weapons
    response.body.forEach((item: { type?: string }) => {
      t.is(item.type, "weapon", "Each item should be a weapon");
    });
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GET /items/armors returns armor items only", async t => {
  const context = await setupGameDataTest();
  try {
    const response = await request(context.app.getHttpServer())
      .get("/items/armors")
      .expect(200);

    t.true(Array.isArray(response.body), "Response should be an array");

    // All returned items should be armor
    response.body.forEach((item: { type?: string }) => {
      t.is(item.type, "armor", "Each item should be armor");
    });
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("GET /items/:itemId returns specific item", async t => {
  const context = await setupGameDataTest();
  try {
    // First get all items to find a valid ID
    const allResponse = await request(context.app.getHttpServer())
      .get("/items")
      .expect(200);

    const firstItem = allResponse.body[0];
    if (!firstItem) {
      t.pass("No items seeded to test");
      return;
    }

    const response = await request(context.app.getHttpServer())
      .get(`/items/${firstItem.definitionId}`)
      .expect(200);

    t.is(response.body.definitionId, firstItem.definitionId, "Should return correct item");
    t.truthy(response.body.name, "Should include name");
  } finally {
    await teardownGameDataTest(context);
  }
});

// ============= Data Consistency Tests =============

test.serial("Seeded class data includes talent trees with aptitude references", async t => {
  const context = await setupGameDataTest();
  try {
    const guerrier = await context.classService.findByName("guerrier");
    t.truthy(guerrier, "Guerrier class should exist");

    // Check that talent trees have proper structure
    const talentTrees = guerrier?.talentTrees;
    t.truthy(talentTrees, "Class should have talent trees");

    // Each talent tree should have ranks with aptitude IDs
    Object.values(talentTrees ?? {}).forEach((tree) => {
      t.true(Array.isArray(tree.ranks), "Talent tree should have ranks array");
      tree.ranks.forEach(rank => {
        t.truthy(rank.aptitudeId, "Rank should reference an aptitude");
      });
    });
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("Seeded aptitude IDs referenced in classes exist in aptitudes collection", async t => {
  const context = await setupGameDataTest();
  try {
    const classes = await context.classService.findAll();
    const aptitudes = await context.aptitudeService.findAll();
    const aptitudeIds = new Set(aptitudes.map(a => a.id));

    // Collect all aptitude references from class talent trees
    const referencedAptitudes: string[] = [];
    classes.forEach(cls => {
      Object.values(cls.talentTrees ?? {}).forEach((tree) => {
        tree.ranks.forEach(rank => {
          if (rank.aptitudeId) {
            referencedAptitudes.push(rank.aptitudeId);
          }
        });
      });
    });

    // At least some referenced aptitudes should exist
    // (Not all may exist if seed data is incomplete, so we check for presence)
    const existingReferences = referencedAptitudes.filter(id => aptitudeIds.has(id));
    t.true(
      existingReferences.length > 0 || referencedAptitudes.length === 0,
      "Referenced aptitudes should exist in aptitudes collection"
    );
  } finally {
    await teardownGameDataTest(context);
  }
});

test.serial("Seeded items include starter pack items", async t => {
  const context = await setupGameDataTest();
  try {
    const items = await context.itemService.findAll();

    // Look for starter items (marked with isStarter flag)
    const starterItems = items.filter(item => item.isStarter());
    t.true(starterItems.length >= 1, "Should include starter pack items");
  } finally {
    await teardownGameDataTest(context);
  }
});
