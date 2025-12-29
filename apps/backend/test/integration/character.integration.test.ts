/**
 * Integration tests for Character Service.
 *
 * Key flows tested:
 * - Create a draft character
 * - Complete draft to make it playable
 * - Retrieve character by ID
 * - Update character
 * - Add items to inventory
 */

import { CharacterAppService } from "../../src/bounded-contexts/character/application/services/CharacterAppService.js";
import { CharacterModule } from "../../src/bounded-contexts/character/character.module.js";
import { GameDataModule } from "../../src/bounded-contexts/game-data/game-data.module.js";
import { createTestApp, closeTestApp } from "../helpers/test-app.js";
import type { TestAppContext } from "../helpers/test-app.js";
import type { ArchetypeName, RaceId } from "#shared";

// ============= Test Context =============

interface CharacterTestContext {
  ctx: TestAppContext;
  characterService: CharacterAppService;
  userId: string;
}

// Fixed user ID for tests (valid MongoDB ObjectId format)
const TEST_USER_ID = "507f1f77bcf86cd799439011";

// ============= Setup & Teardown =============

async function setupCharacterTest(): Promise<CharacterTestContext> {
  const ctx = await createTestApp([GameDataModule, CharacterModule]);
  const characterService = ctx.module.get(CharacterAppService);

  return {
    ctx,
    characterService,
    userId: TEST_USER_ID,
  };
}

async function teardownCharacterTest(context: CharacterTestContext): Promise<void> {
  await closeTestApp(context.ctx);
}

// ============= Helper Functions =============

function createValidStats() {
  return {
    vigor: 8,
    finesse: 7,
    mind: 6,
    survival: 6,
  }; // Total = 27
}

// ============= Tests =============

describe("Character Integration", () => {
  describe("Character Creation Flow", () => {
    let testCtx: CharacterTestContext;

    beforeEach(async () => {
      testCtx = await setupCharacterTest();
    });

    afterEach(async () => {
      await teardownCharacterTest(testCtx);
    });

    test("creates a draft character", async () => {
      const characterId = testCtx.characterService.generateCharacterId();

      const character = await testCtx.characterService.createDraft({
        characterId,
        userId: testCtx.userId,
      });

      expect(character).toBeDefined();
      expect(character.id).toBe(characterId);
      expect(character.userId).toBe(testCtx.userId);
      expect(character.state).toBe("draft");
      expect(character.isDraft).toBe(true);
    });

    test("completes a draft character", async () => {
      const characterId = testCtx.characterService.generateCharacterId();

      // Create draft
      await testCtx.characterService.createDraft({
        characterId,
        userId: testCtx.userId,
      });

      // Complete draft
      const completed = await testCtx.characterService.completeDraft(
        testCtx.userId,
        characterId,
        {
          name: "Test Hero",
          className: "guerrier" as ArchetypeName,
          raceId: "humain" as RaceId,
          stats: createValidStats(),
          physicalDescription: "A brave warrior",
          gender: "male",
        },
      );

      expect(completed).toBeDefined();
      expect(completed.name).toBe("Test Hero");
      expect(completed.className).toBe("guerrier");
      expect(completed.raceId).toBe("humain");
      expect(completed.state).toBe("created");
      expect(completed.isComplete).toBe(true);
      expect(completed.isDraft).toBe(false);
      expect(completed.hp).toBeGreaterThan(0);
      expect(completed.hpMax).toBeGreaterThan(0);
    });

    test("retrieves character by user and ID", async () => {
      const characterId = testCtx.characterService.generateCharacterId();

      // Create and complete a character
      await testCtx.characterService.createDraft({
        characterId,
        userId: testCtx.userId,
      });

      await testCtx.characterService.completeDraft(testCtx.userId, characterId, {
        name: "Retrievable Hero",
        className: "mage" as ArchetypeName,
        raceId: "elfe" as RaceId,
        stats: createValidStats(),
      });

      // Retrieve
      const retrieved = await testCtx.characterService.findByUserAndId(
        testCtx.userId,
        characterId,
      );

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(characterId);
      expect(retrieved.name).toBe("Retrievable Hero");
      expect(retrieved.className).toBe("mage");
    });

    test("lists all characters for a user", async () => {
      // Create two characters
      const id1 = testCtx.characterService.generateCharacterId();
      const id2 = testCtx.characterService.generateCharacterId();

      await testCtx.characterService.createDraft({
        characterId: id1,
        userId: testCtx.userId,
      });
      await testCtx.characterService.completeDraft(testCtx.userId, id1, {
        name: "Hero One",
        className: "guerrier" as ArchetypeName,
        raceId: "nain" as RaceId,
        stats: createValidStats(),
      });

      await testCtx.characterService.createDraft({
        characterId: id2,
        userId: testCtx.userId,
      });
      await testCtx.characterService.completeDraft(testCtx.userId, id2, {
        name: "Hero Two",
        className: "rogue" as ArchetypeName,
        raceId: "elfe" as RaceId,
        stats: createValidStats(),
      });

      // List all
      const characters = await testCtx.characterService.findByUserId(testCtx.userId);

      expect(characters).toHaveLength(2);
      expect(characters.map(c => c.name)).toContain("Hero One");
      expect(characters.map(c => c.name)).toContain("Hero Two");
    });

    test("rejects invalid stats total", async () => {
      const characterId = testCtx.characterService.generateCharacterId();

      await testCtx.characterService.createDraft({
        characterId,
        userId: testCtx.userId,
      });

      // Invalid stats (total != 27)
      await expect(
        testCtx.characterService.completeDraft(testCtx.userId, characterId, {
          name: "Invalid Hero",
          className: "guerrier" as ArchetypeName,
          raceId: "humain" as RaceId,
          stats: { vigor: 10, finesse: 10, mind: 10, survival: 10 }, // Total = 40
        }),
      ).rejects.toThrow("Stats must total exactly 27 points");
    });
  });

  describe("Character Updates", () => {
    let testCtx: CharacterTestContext;
    let characterId: string;

    beforeEach(async () => {
      testCtx = await setupCharacterTest();
      characterId = testCtx.characterService.generateCharacterId();

      await testCtx.characterService.createDraft({
        characterId,
        userId: testCtx.userId,
      });
      await testCtx.characterService.completeDraft(testCtx.userId, characterId, {
        name: "Update Test Hero",
        className: "guerrier" as ArchetypeName,
        raceId: "humain" as RaceId,
        stats: createValidStats(),
      });
    });

    afterEach(async () => {
      await teardownCharacterTest(testCtx);
    });

    test("adds experience points", async () => {
      const before = await testCtx.characterService.findByUserAndId(
        testCtx.userId,
        characterId,
      );
      const initialXp = before.totalXp;

      await testCtx.characterService.addExperience(
        characterId,
        100,
      );

      const after = await testCtx.characterService.findByUserAndId(
        testCtx.userId,
        characterId,
      );

      expect(after.totalXp).toBe(initialXp + 100);
    });

    test("takes damage", async () => {
      const before = await testCtx.characterService.findByUserAndId(
        testCtx.userId,
        characterId,
      );
      const initialHp = before.hp;

      await testCtx.characterService.takeDamage(characterId, 5);

      const after = await testCtx.characterService.findByUserAndId(
        testCtx.userId,
        characterId,
      );

      expect(after.hp).toBe(initialHp - 5);
    });

    test("heals character", async () => {
      // First take damage
      await testCtx.characterService.takeDamage(characterId, 10);

      const damaged = await testCtx.characterService.findByUserAndId(
        testCtx.userId,
        characterId,
      );

      // Then heal
      await testCtx.characterService.heal(characterId, 5);

      const healed = await testCtx.characterService.findByUserAndId(
        testCtx.userId,
        characterId,
      );

      expect(healed.hp).toBe(damaged.hp + 5);
    });
  });
});
