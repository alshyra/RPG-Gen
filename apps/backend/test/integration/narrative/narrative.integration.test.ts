/**
 * Integration tests for Game Narrative Service.
 *
 * Key flows tested:
 * - Create and retrieve narrative sessions
 * - Add messages to narrative
 * - Retrieve message history
 * - Clear narrative
 */

import { GameNarrativeModule } from "../../../src/bounded-contexts/game-narrative/game-narrative.module.js";
import { NarrativeAppService } from "../../../src/bounded-contexts/game-narrative/application/services/NarrativeAppService.js";
import { Context } from "../../../src/bounded-contexts/game-narrative/domain/narrative/value-objects/Context.js";
import { Message } from "../../../src/bounded-contexts/game-narrative/domain/narrative/value-objects/Message.js";
import { createTestApp, closeTestApp } from "../../helpers/test-app.js";
import type { TestAppContext } from "../../helpers/test-app.js";

// ============= Test Context =============

interface NarrativeTestContext {
  ctx: TestAppContext;
  narrativeService: NarrativeAppService;
  userId: string;
  characterId: string;
}

// Fixed IDs for tests
const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_CHARACTER_ID = "test-char-001";

// ============= Setup & Teardown =============

async function setupNarrativeTest(): Promise<NarrativeTestContext> {
  const ctx = await createTestApp([GameNarrativeModule]);
  const narrativeService = ctx.module.get(NarrativeAppService);

  return {
    ctx,
    narrativeService,
    userId: TEST_USER_ID,
    characterId: TEST_CHARACTER_ID,
  };
}

async function teardownNarrativeTest(context: NarrativeTestContext): Promise<void> {
  await closeTestApp(context.ctx);
}

// ============= Helper Functions =============

function createTestContext(): Context {
  return new Context({
    characterContext: {
      name: "Test Hero",
      race: "humain",
      className: "guerrier",
      level: 1,
      gender: "male",
      stats: { vigor: 8, finesse: 7, mind: 6, survival: 6 },
      currentHp: 20,
      maxHp: 20,
    },
    systemPrompt: "You are a game master for a fantasy RPG.",
    scenarioPrompt: "The adventure begins in a dark forest.",
  });
}

function createSessionId(userId: string, characterId: string): string {
  return `${userId}_${characterId}`;
}

// ============= Tests =============

describe("Game Narrative Integration", () => {
  describe("Narrative Session", () => {
    let testCtx: NarrativeTestContext;

    beforeEach(async () => {
      testCtx = await setupNarrativeTest();
    });

    afterEach(async () => {
      await teardownNarrativeTest(testCtx);
    });

    test("creates a new narrative session", async () => {
      const context = createTestContext();
      const sessionId = createSessionId(testCtx.userId, testCtx.characterId);

      const narrative = await testCtx.narrativeService.getOrCreateNarrative(
        testCtx.userId,
        testCtx.characterId,
        sessionId,
        context,
      );

      expect(narrative).toBeDefined();
      expect(narrative.userId).toBe(testCtx.userId);
      expect(narrative.characterId).toBe(testCtx.characterId);
      expect(narrative.sessionId).toBe(sessionId);
    });

    test("retrieves existing narrative session", async () => {
      const context = createTestContext();
      const sessionId = createSessionId(testCtx.userId, testCtx.characterId);

      // Create first
      await testCtx.narrativeService.getOrCreateNarrative(
        testCtx.userId,
        testCtx.characterId,
        sessionId,
        context,
      );

      // Get again
      const narrative = await testCtx.narrativeService.getOrCreateNarrative(
        testCtx.userId,
        testCtx.characterId,
        sessionId,
        context,
      );

      expect(narrative).toBeDefined();
      expect(narrative.userId).toBe(testCtx.userId);
    });
  });

  describe("Message Management", () => {
    let testCtx: NarrativeTestContext;

    beforeEach(async () => {
      testCtx = await setupNarrativeTest();
      const context = createTestContext();
      const sessionId = createSessionId(testCtx.userId, testCtx.characterId);
      // Ensure narrative exists
      await testCtx.narrativeService.getOrCreateNarrative(
        testCtx.userId,
        testCtx.characterId,
        sessionId,
        context,
      );
    });

    afterEach(async () => {
      await teardownNarrativeTest(testCtx);
    });

    test("adds user message to narrative", async () => {
      const message = new Message({
        role: "user",
        narrative: "Hello, game master!",
      });

      const narrative = await testCtx.narrativeService.addMessage(
        testCtx.userId,
        testCtx.characterId,
        message,
      );

      expect(narrative.messages).toHaveLength(1);
      expect(narrative.messages[0].role).toBe("user");
      expect(narrative.messages[0].narrative).toBe("Hello, game master!");
    });

    test("adds assistant message to narrative", async () => {
      const message = new Message({
        role: "assistant",
        narrative: "Welcome, brave adventurer!",
        instructions: [{ type: "xp", xp: 10 }],
      });

      const narrative = await testCtx.narrativeService.addMessage(
        testCtx.userId,
        testCtx.characterId,
        message,
      );

      expect(narrative.messages).toHaveLength(1);
      expect(narrative.messages[0].role).toBe("assistant");
      expect(narrative.messages[0].instructions).toHaveLength(1);
    });

    test("retrieves recent messages", async () => {
      // Add multiple messages
      await testCtx.narrativeService.addMessage(
        testCtx.userId,
        testCtx.characterId,
        new Message({ role: "user", narrative: "Message 1" }),
      );
      await testCtx.narrativeService.addMessage(
        testCtx.userId,
        testCtx.characterId,
        new Message({ role: "assistant", narrative: "Response 1" }),
      );
      await testCtx.narrativeService.addMessage(
        testCtx.userId,
        testCtx.characterId,
        new Message({ role: "user", narrative: "Message 2" }),
      );

      const messages = await testCtx.narrativeService.getRecentMessages(
        testCtx.userId,
        testCtx.characterId,
        2,
      );

      expect(messages).toHaveLength(2);
      // Should return most recent
      expect(messages[1].narrative).toBe("Message 2");
    });

    test("retrieves all messages", async () => {
      await testCtx.narrativeService.addMessage(
        testCtx.userId,
        testCtx.characterId,
        new Message({ role: "user", narrative: "First message" }),
      );
      await testCtx.narrativeService.addMessage(
        testCtx.userId,
        testCtx.characterId,
        new Message({ role: "assistant", narrative: "First response" }),
      );

      const messages = await testCtx.narrativeService.getAllMessages(
        testCtx.userId,
        testCtx.characterId,
      );

      expect(messages).toHaveLength(2);
    });
  });

  describe("Narrative Cleanup", () => {
    let testCtx: NarrativeTestContext;

    beforeEach(async () => {
      testCtx = await setupNarrativeTest();
    });

    afterEach(async () => {
      await teardownNarrativeTest(testCtx);
    });

    test("clears narrative messages", async () => {
      const context = createTestContext();
      const sessionId = createSessionId(testCtx.userId, testCtx.characterId);

      // Setup with messages
      await testCtx.narrativeService.getOrCreateNarrative(
        testCtx.userId,
        testCtx.characterId,
        sessionId,
        context,
      );
      await testCtx.narrativeService.addMessage(
        testCtx.userId,
        testCtx.characterId,
        new Message({ role: "user", narrative: "Test message" }),
      );

      // Clear
      await testCtx.narrativeService.clearNarrative(
        testCtx.userId,
        testCtx.characterId,
      );

      // Verify cleared
      const messages = await testCtx.narrativeService.getAllMessages(
        testCtx.userId,
        testCtx.characterId,
      );

      expect(messages).toHaveLength(0);
    });

    test("deletes narrative completely", async () => {
      const context = createTestContext();
      const sessionId = createSessionId(testCtx.userId, testCtx.characterId);

      await testCtx.narrativeService.getOrCreateNarrative(
        testCtx.userId,
        testCtx.characterId,
        sessionId,
        context,
      );

      await testCtx.narrativeService.deleteNarrative(
        testCtx.userId,
        testCtx.characterId,
      );

      // Getting narrative again should create a new one (empty)
      const narrative = await testCtx.narrativeService.getOrCreateNarrative(
        testCtx.userId,
        testCtx.characterId,
        sessionId,
        context,
      );

      expect(narrative.messages).toHaveLength(0);
    });
  });
});
