/**
 * Integration test for PM consistency between move, status, and endPlayerTurn
 * 
 * Reproduces the issue:
 * 1. Player moves (consumes PM)
 * 2. GET /status should show consumed PM
 * 3. POST /endturn resets PM for next turn
 * 4. GET /status should show refreshed PM
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { type TestAppContext, createTestApp, closeTestApp } from "../../helpers/test-app.js";
import { CombatModule } from "../../../src/bounded-contexts/combat/combat.module.js";
import { CharacterModule } from "../../../src/bounded-contexts/character/character.module.js";
import { GameDataModule } from "../../../src/bounded-contexts/game-data/game-data.module.js";
import { CombatOrchestrator } from "../../../src/workflows/combat-gameplay/CombatWorkflow.js";
import { CombatMovementOrchestrator } from "../../../src/workflows/combat-gameplay/CombatMovementWorkflow.js";
import { CharacterAppService } from "../../../src/bounded-contexts/character/application/services/CharacterAppService.js";

interface CombatTestContext {
  ctx: TestAppContext;
  combatOrchestrator: CombatOrchestrator;
  movementOrchestrator: CombatMovementOrchestrator;
  characterService: CharacterAppService;
  userId: string;
  characterId: string;
}

const TEST_USER_ID = "507f1f77bcf86cd799439011";

async function setupCombatTest(): Promise<CombatTestContext> {
  const ctx = await createTestApp([CharacterModule, CombatModule, GameDataModule]);
  
  const combatOrchestrator = ctx.module.get(CombatOrchestrator);
  const movementOrchestrator = ctx.module.get(CombatMovementOrchestrator);
  const characterService = ctx.module.get(CharacterAppService);

  // Create a test character
  const characterId = characterService.generateCharacterId();
  await characterService.createDraft({ characterId, userId: TEST_USER_ID });
  await characterService.update(TEST_USER_ID, characterId, {
    name: "PM Test Hero",
    className: "guerrier",
    raceId: "humain",
    portrait: "test-portrait.png",
    stats: { vigor: 2, finesse: 1, mind: 1, survival: 1 },
    state: "created",
  });

  return {
    ctx,
    combatOrchestrator,
    movementOrchestrator,
    characterService,
    userId: TEST_USER_ID,
    characterId,
  };
}

async function teardownCombatTest(context: CombatTestContext): Promise<void> {
  await closeTestApp(context.ctx);
}

describe("PM Consistency Integration Tests", () => {
  let testCtx: CombatTestContext;

  beforeEach(async () => {
    testCtx = await setupCombatTest();
  });

  afterEach(async () => {
    await teardownCombatTest(testCtx);
  });

  test("PM should reset after end turn", async () => {
    // 1. Start combat
    const combatStart = await testCtx.combatOrchestrator.startCombat(
      testCtx.userId,
      testCtx.characterId,
      {
        combat_start: [
          {
            name: "Goblin",
            hp: 5,
            attack_bonus: 0,
          },
        ],
      },
    );

    expect(combatStart.player.pm).toBe(4); // Full PM at start
    expect(combatStart.player.pmMax).toBe(4);

    // 2. Move player (consumes 2 PM - path of length 3 = cost 2)
    const moveResult = await testCtx.movementOrchestrator.executeMovement(
      testCtx.userId,
      testCtx.characterId,
      {
        combatantId: testCtx.characterId,
        path: [
          { x: 2, y: 5 }, // Start
          { x: 3, y: 5 }, // Move 1
          { x: 4, y: 5 }, // Move 2
        ],
      },
    );

    expect(moveResult.success).toBe(true);
    expect(moveResult.pm).toBe(2); // 4 - 2 = 2 PM remaining

    // 3. Check status - PM should still be consumed
    const statusAfterMove = await testCtx.combatOrchestrator.getStatus(
      testCtx.userId,
      testCtx.characterId,
    );

    expect(statusAfterMove).not.toBeNull();
    expect(statusAfterMove!.player.pm).toBe(2); // Should show consumed PM
    expect(statusAfterMove!.player.pa).toBe(6); // PA unchanged

    // 4. Move again (consume 1 more PM)
    const moveResult2 = await testCtx.movementOrchestrator.executeMovement(
      testCtx.userId,
      testCtx.characterId,
      {
        combatantId: testCtx.characterId,
        path: [
          { x: 4, y: 5 }, // Current
          { x: 5, y: 5 }, // Move 1
        ],
      },
    );

    expect(moveResult2.success).toBe(true);
    expect(moveResult2.pm).toBe(1); // 2 - 1 = 1 PM remaining

    // 5. Check status again - should show 1 PM
    const statusBeforeEndTurn = await testCtx.combatOrchestrator.getStatus(
      testCtx.userId,
      testCtx.characterId,
    );

    expect(statusBeforeEndTurn).not.toBeNull();
    expect(statusBeforeEndTurn!.player.pm).toBe(1); // Should show 1 PM consumed

    // 6. End player turn - should reset PM/PA for next turn
    const endTurnResult = await testCtx.combatOrchestrator.endPlayerTurn(
      testCtx.userId,
      testCtx.characterId,
    );

    expect(endTurnResult.combatState.roundNumber).toBe(2); // Round incremented
    expect(endTurnResult.combatState.player.pm).toBe(4); // PM reset to max
    expect(endTurnResult.combatState.player.pa).toBe(6); // PA reset to max

    // 7. Check status after endTurn - should show refreshed PM
    const statusAfterEndTurn = await testCtx.combatOrchestrator.getStatus(
      testCtx.userId,
      testCtx.characterId,
    );

    expect(statusAfterEndTurn).not.toBeNull();
    expect(statusAfterEndTurn!.player.pm).toBe(4); // Full PM for new turn
    expect(statusAfterEndTurn!.player.pa).toBe(6); // Full PA for new turn
    expect(statusAfterEndTurn!.roundNumber).toBe(2);
  });

  test("Cannot move with 0 PM", async () => {
    // 1. Start combat
    await testCtx.combatOrchestrator.startCombat(
      testCtx.userId,
      testCtx.characterId,
      {
        combat_start: [
          {
            name: "Goblin",
            hp: 5,
            attack_bonus: 0,
          },
        ],
      },
    );

    // 2. Exhaust all PM (4 moves of 1 PM each)
    for (let i = 0; i < 4; i++) {
      const moveResult = await testCtx.movementOrchestrator.executeMovement(
        testCtx.userId,
        testCtx.characterId,
        {
          combatantId: testCtx.characterId,
          path: [
            { x: 2 + i, y: 5 },
            { x: 3 + i, y: 5 },
          ],
        },
      );
      expect(moveResult.success).toBe(true);
      expect(moveResult.pm).toBe(3 - i);
    }

    // 3. Try to move with 0 PM - should fail
    const failedMove = await testCtx.movementOrchestrator.executeMovement(
      testCtx.userId,
      testCtx.characterId,
      {
        combatantId: testCtx.characterId,
        path: [
          { x: 6, y: 5 },
          { x: 7, y: 5 },
        ],
      },
    );

    expect(failedMove.success).toBe(false);
    expect(failedMove.pm).toBe(0);
    expect(failedMove.errorMessage).toContain("Not enough PM");

    // 4. Status should show 0 PM
    const status = await testCtx.combatOrchestrator.getStatus(
      testCtx.userId,
      testCtx.characterId,
    );

    expect(status).not.toBeNull();
    expect(status!.player.pm).toBe(0);
  });
});
