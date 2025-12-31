/**
 * Integration tests for PM (Movement Points) consumption during combat movement.
 *
 * These tests verify:
 * - PM is consumed correctly after a move
 * - Player cannot move when PM is 0
 * - PM is returned in movement response
 */
import { describe, test, expect, afterEach } from "@jest/globals";
import { CombatModule } from "../../../src/bounded-contexts/combat/combat.module.js";
import { CombatAppService } from "../../../src/bounded-contexts/combat/application/services/CombatAppService.js";
import { CombatMovementOrchestrator } from "../../../src/workflows/combat-gameplay/CombatMovementWorkflow.js";
import { CharacterAppService } from "../../../src/bounded-contexts/character/application/services/CharacterAppService.js";
import { DiceService } from "../../../src/bounded-contexts/game-narrative/domain/dice/DiceService.js";
import type { CharacterResponseDto } from "../../../src/bounded-contexts/character/api/dto/index.js";
import { type CombatStartRequestDto } from "../../../src/bounded-contexts/combat/api/dto/response/index.js";
import { GridPositionDto } from "../../../src/bounded-contexts/combat/api/dto/response/GridPositionDto.js";
import { createTestApp, closeTestApp, type TestAppContext } from "../../helpers/test-app.js";
import { createMockDiceService } from "../../mocks/dice.mock.js";

// ============= Test Context =============

interface MovementTestContext {
  ctx: TestAppContext;
  combatService: CombatAppService;
  movementOrchestrator: CombatMovementOrchestrator;
  characterService: CharacterAppService;
}

// Fixed user ID for tests (valid MongoDB ObjectId format)
const TEST_USER_ID = "507f1f77bcf86cd799439011";

// ============= Test Fixtures =============

/**
 * Create a minimal character DTO for movement testing
 * PM defaults to 4 (movement points from class stats)
 */
function createTestCharacter(overrides: Partial<CharacterResponseDto> = {}): CharacterResponseDto {
  return {
    characterId: "test-char-movement",
    name: "Test Mover",
    portrait: "",
    isDeceased: false,
    state: "created",
    hp: 20,
    hpMax: 20,
    stats: {
      vigor: 2,
      finesse: 1,
      mind: 1,
      survival: 1,
    },
    inventory: [],
    ...overrides,
  };
}

/**
 * Create a combat start request with 1 enemy
 */
function createCombatStartRequest(): CombatStartRequestDto {
  return {
    combat_start: [
      {
        name: "Goblin",
        hp: 7,
        ac: 13,
        attack_bonus: 4,
        damage_dice: "1d6",
        damage_bonus: 2,
      },
    ],
  };
}

// ============= Setup & Teardown =============

async function setupMovementTest(diceRolls: number[]): Promise<MovementTestContext> {
  const mockDice = createMockDiceService({ rolls: diceRolls });

  const ctx = await createTestApp(
    [CombatModule],
    [
      {
        provide: DiceService,
        useValue: mockDice,
      },
    ],
  );

  const combatService = ctx.module.get(CombatAppService);
  const movementOrchestrator = ctx.module.get(CombatMovementOrchestrator);
  const characterService = ctx.module.get(CharacterAppService);

  return {
    ctx,
    combatService,
    movementOrchestrator,
    characterService,
  };
}

// ============= PM Consumption Tests =============

describe("PM Consumption during movement", () => {
  let testCtx: MovementTestContext | null = null;

  afterEach(async () => {
    if (testCtx) {
      await closeTestApp(testCtx.ctx);
      testCtx = null;
    }
  });

  test("movement consumes PM correctly", async () => {
    // Dice rolls: enemy init, player init
    testCtx = await setupMovementTest([10, 15]);

    const character = createTestCharacter();
    const combatStart = createCombatStartRequest();

    // Initialize combat
    const state = await testCtx.combatService.initializeCombat(
      character,
      combatStart,
      TEST_USER_ID,
    );

    // Verify initial PM is set (should be 4 from class stats)
    expect(state.player.pm).toBe(4);
    expect(state.player.pmMax).toBe(4);

    // Get the player's current position
    const startPos = state.player.position ?? { x: 0, y: 0 };

    // Create a movement path of 2 tiles from current position
    const path = [
      new GridPositionDto(startPos.x, startPos.y), // Starting position
      new GridPositionDto(startPos.x + 1, startPos.y), // +1 tile
      new GridPositionDto(startPos.x + 2, startPos.y), // +1 tile = 2 PM cost
    ];

    // Execute movement
    const result = await testCtx.movementOrchestrator.executeMovement(
      TEST_USER_ID,
      character.characterId,
      {
        combatantId: state.player.id,
        path,
      },
    );

    // Log the result for debugging
    console.log("Movement result:", JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);
    expect(result.pm).toBe(2);

    // Verify state was persisted
    const updatedState = await testCtx.combatService.getCombatState(character.characterId);
    expect(updatedState.player.pm).toBe(2);
  });

  test("movement fails when not enough PM", async () => {
    // Dice rolls: enemy init, player init
    testCtx = await setupMovementTest([10, 15]);

    const character = createTestCharacter();
    const combatStart = createCombatStartRequest();

    // Initialize combat
    const state = await testCtx.combatService.initializeCombat(
      character,
      combatStart,
      TEST_USER_ID,
    );

    // Get the player's current position
    const startPos = state.player.position ?? { x: 0, y: 0 };

    // First, consume all PM with a 4-tile move
    const firstPath = [
      new GridPositionDto(startPos.x, startPos.y),
      new GridPositionDto(startPos.x + 1, startPos.y),
      new GridPositionDto(startPos.x + 2, startPos.y),
      new GridPositionDto(startPos.x + 3, startPos.y),
      new GridPositionDto(startPos.x + 4, startPos.y), // 4 tiles = 4 PM
    ];

    const firstResult = await testCtx.movementOrchestrator.executeMovement(
      TEST_USER_ID,
      character.characterId,
      {
        combatantId: state.player.id,
        path: firstPath,
      },
    );

    expect(firstResult.success).toBe(true);
    expect(firstResult.pm).toBe(0);

    // Now try to move again - should fail
    // New position after first move
    const endPos = { x: startPos.x + 4, y: startPos.y };
    const secondPath = [
      new GridPositionDto(endPos.x, endPos.y),
      new GridPositionDto(endPos.x + 1, endPos.y), // Trying to move 1 more tile
    ];

    const secondResult = await testCtx.movementOrchestrator.executeMovement(
      TEST_USER_ID,
      character.characterId,
      {
        combatantId: state.player.id,
        path: secondPath,
      },
    );

    expect(secondResult.success).toBe(false);
    expect(secondResult.pm).toBe(0);
    expect(secondResult.errorMessage).toBeTruthy();
    expect(secondResult.errorMessage).toContain("Not enough PM");
  });

  test("movement fails when path cost exceeds available PM", async () => {
    // Dice rolls: enemy init, player init
    testCtx = await setupMovementTest([10, 15]);

    const character = createTestCharacter();
    const combatStart = createCombatStartRequest();

    // Initialize combat
    const state = await testCtx.combatService.initializeCombat(
      character,
      combatStart,
      TEST_USER_ID,
    );

    // Get the player's current position
    const startPos = state.player.position ?? { x: 0, y: 0 };

    // Try to move 5 tiles when PM is only 4
    const path = [
      new GridPositionDto(startPos.x, startPos.y),
      new GridPositionDto(startPos.x + 1, startPos.y),
      new GridPositionDto(startPos.x + 2, startPos.y),
      new GridPositionDto(startPos.x + 3, startPos.y),
      new GridPositionDto(startPos.x + 4, startPos.y),
      new GridPositionDto(startPos.x + 5, startPos.y), // 5 tiles = 5 PM required
    ];

    const result = await testCtx.movementOrchestrator.executeMovement(
      TEST_USER_ID,
      character.characterId,
      {
        combatantId: state.player.id,
        path,
      },
    );

    expect(result.success).toBe(false);
    expect(result.pm).toBe(4);
    expect(result.errorMessage).toBeTruthy();
    expect(result.errorMessage).toContain("requires 5");
    expect(result.errorMessage).toContain("has 4");
  });

  test("PM is included in response even on failure", async () => {
    // Dice rolls: enemy init, player init
    testCtx = await setupMovementTest([10, 15]);

    const character = createTestCharacter();
    const combatStart = createCombatStartRequest();

    // Initialize combat
    await testCtx.combatService.initializeCombat(
      character,
      combatStart,
      TEST_USER_ID,
    );

    // Try an invalid empty path
    const result = await testCtx.movementOrchestrator.executeMovement(
      TEST_USER_ID,
      character.characterId,
      {
        combatantId: "player-1",
        path: [new GridPositionDto(0, 0)], // Only 1 point = invalid
      },
    );

    expect(result.success).toBe(false);
    expect(typeof result.pm).toBe("number");
    expect(result.errorMessage).toBeTruthy();
  });
});
