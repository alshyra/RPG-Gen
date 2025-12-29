/**
 * Integration tests for Combat Service.
 *
 * Key flows tested:
 * - Initialize combat with enemies
 * - Turn order management
 * - Apply damage to enemies and player
 * - End combat when all enemies or player is defeated
 */

import { jest } from "@jest/globals";
import { CombatModule } from "../../src/bounded-contexts/combat/combat.module.js";
import { CombatAppService } from "../../src/bounded-contexts/combat/application/services/CombatAppService.js";
import { CharacterAppService } from "../../src/bounded-contexts/character/application/services/CharacterAppService.js";
import { DiceService } from "../../src/bounded-contexts/game-narrative/domain/dice/DiceService.js";
import { createTestApp, closeTestApp } from "../helpers/test-app.js";
import type { TestAppContext } from "../helpers/test-app.js";
import type { CombatStartRequestDto } from "../../src/bounded-contexts/combat/api/dto/response/index.js";
import type { ArchetypeName, RaceId } from "#shared";
import type { CharacterResponseDto } from "../../src/bounded-contexts/character/api/dto/response/CharacterResponseDto.js";

// ============= Test Context =============

interface CombatTestContext {
  ctx: TestAppContext;
  combatService: CombatAppService;
  characterService: CharacterAppService;
  userId: string;
}

// Fixed user ID for tests (valid MongoDB ObjectId format)
const TEST_USER_ID = "507f1f77bcf86cd799439011";

// ============= Mock Dice Service =============

function createMockDiceService(rolls: number[]) {
  let rollIndex = 0;
  return {
    rollDiceExpr: jest.fn().mockImplementation(() => {
      const roll = rolls[rollIndex % rolls.length];
      rollIndex++;
      return { rolls: [roll], modifierValue: 0, total: roll };
    }),
    rollD20: jest.fn().mockImplementation(() => {
      const roll = rolls[rollIndex % rolls.length];
      rollIndex++;
      return roll;
    }),
    roll: jest.fn().mockImplementation((sides: number) => {
      const roll = rolls[rollIndex % rolls.length];
      rollIndex++;
      return roll;
    }),
  };
}

// ============= Setup & Teardown =============

async function setupCombatTest(diceRolls: number[] = [15, 10]): Promise<CombatTestContext> {
  const mockDice = createMockDiceService(diceRolls);

  // CombatModule already imports CharacterModule and GameDataModule, so we only need CombatModule
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
  const characterService = ctx.module.get(CharacterAppService);

  return {
    ctx,
    combatService,
    characterService,
    userId: TEST_USER_ID,
  };
}

async function teardownCombatTest(context: CombatTestContext): Promise<void> {
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

async function createTestCharacter(
  testCtx: CombatTestContext,
  overrides: Partial<{ name: string; className: ArchetypeName }> = {},
): Promise<CharacterResponseDto> {
  const characterId = testCtx.characterService.generateCharacterId();

  await testCtx.characterService.createDraft({
    characterId,
    userId: testCtx.userId,
  });

  const character = await testCtx.characterService.completeDraft(
    testCtx.userId,
    characterId,
    {
      name: overrides.name ?? "Test Warrior",
      className: overrides.className ?? ("guerrier" as ArchetypeName),
      raceId: "humain" as RaceId,
      stats: createValidStats(),
    },
  );

  // Convert entity to DTO format for combat service
  const stats = character.stats;
  return {
    characterId: character.id,
    name: character.name ?? "Test Warrior",
    portrait: character.portrait ?? "",
    isDeceased: character.isDeceased,
    state: character.state,
    hp: character.hp,
    hpMax: character.hpMax,
    stats: stats ? {
      vigor: stats.vigor,
      finesse: stats.finesse,
      mind: stats.mind,
      survival: stats.survival,
    } : undefined,
    level: character.level,
    className: character.className,
    raceId: character.raceId,
    inventory: [],
  } as unknown as CharacterResponseDto;
}

function createCombatStartRequest(numEnemies: number): CombatStartRequestDto {
  return {
    combat_start: Array.from({ length: numEnemies }, (_, i) => ({
      name: `Goblin ${i + 1}`,
      hp: 7,
      ac: 13,
      attack_bonus: 4,
      damage_dice: "1d6",
      damage_bonus: 2,
    })),
  };
}

// ============= Tests =============

describe("Combat Integration", () => {
  describe("Combat Initialization", () => {
    let testCtx: CombatTestContext;

    beforeEach(async () => {
      testCtx = await setupCombatTest([15, 12, 10]); // Initiative rolls
    });

    afterEach(async () => {
      await teardownCombatTest(testCtx);
    });

    test("initializes combat with enemies", async () => {
      const character = await createTestCharacter(testCtx);
      const combatStart = createCombatStartRequest(2);

      const state = await testCtx.combatService.initializeCombat(
        character,
        combatStart,
        testCtx.userId,
      );

      expect(state).toBeDefined();
      expect(state.inCombat).toBe(true);
      expect(state.characterId).toBe(character.characterId);
      expect(state.enemies).toHaveLength(2);
      expect(state.turnOrder).toHaveLength(3); // 2 enemies + 1 player
      expect(state.roundNumber).toBe(1);
    });

    test("creates turn order with player and enemies", async () => {
      const character = await createTestCharacter(testCtx);
      const combatStart = createCombatStartRequest(2);

      const state = await testCtx.combatService.initializeCombat(
        character,
        combatStart,
        testCtx.userId,
      );

      const playerEntries = state.turnOrder.filter(c => c.isPlayer);
      const enemyEntries = state.turnOrder.filter(c => !c.isPlayer);

      expect(playerEntries).toHaveLength(1);
      expect(enemyEntries).toHaveLength(2);
    });

    test("sorts turn order by initiative descending", async () => {
      const character = await createTestCharacter(testCtx);
      const combatStart = createCombatStartRequest(2);

      const state = await testCtx.combatService.initializeCombat(
        character,
        combatStart,
        testCtx.userId,
      );

      // Verify turn order is sorted by initiative (descending)
      const initiativeSorted = state.turnOrder.every((_, idx, arr) => {
        if (idx === 0) return true;
        return arr[idx - 1].initiative >= arr[idx].initiative;
      });

      expect(initiativeSorted).toBe(true);
    });
  });

  describe("Combat State Management", () => {
    let testCtx: CombatTestContext;

    beforeEach(async () => {
      testCtx = await setupCombatTest([15, 10]);
    });

    afterEach(async () => {
      await teardownCombatTest(testCtx);
    });

    test("persists and retrieves combat state", async () => {
      const character = await createTestCharacter(testCtx);
      const combatStart = createCombatStartRequest(1);

      await testCtx.combatService.initializeCombat(
        character,
        combatStart,
        testCtx.userId,
      );

      const retrieved = await testCtx.combatService.getCombatState(
        character.characterId,
      );

      expect(retrieved).toBeDefined();
      expect(retrieved.characterId).toBe(character.characterId);
      expect(retrieved.inCombat).toBe(true);
    });

    test("reports character is in combat", async () => {
      const character = await createTestCharacter(testCtx);
      const combatStart = createCombatStartRequest(1);

      await testCtx.combatService.initializeCombat(
        character,
        combatStart,
        testCtx.userId,
      );

      const isInCombat = await testCtx.combatService.isInCombat(
        character.characterId,
      );

      expect(isInCombat).toBe(true);
    });

    test("reports character not in combat when no combat exists", async () => {
      const isInCombat = await testCtx.combatService.isInCombat("non-existent");

      expect(isInCombat).toBe(false);
    });
  });

  describe("Combat Damage", () => {
    let testCtx: CombatTestContext;

    beforeEach(async () => {
      testCtx = await setupCombatTest([15, 10]);
    });

    afterEach(async () => {
      await teardownCombatTest(testCtx);
    });

    test("applies damage to enemy", async () => {
      const character = await createTestCharacter(testCtx);
      const combatStart = createCombatStartRequest(1);
      combatStart.combat_start[0].hp = 20;

      const state = await testCtx.combatService.initializeCombat(
        character,
        combatStart,
        testCtx.userId,
      );

      const enemy = state.enemies[0];
      const initialHp = enemy.hp;

      const result = await testCtx.combatService.applyPlayerDamage(
        character.characterId,
        enemy.id,
        5,
      );

      const damagedEnemy = result.state.enemies.find(e => e.id === enemy.id);
      expect(damagedEnemy?.hp).toBe(initialHp - 5);
    });

    test("ends combat when last enemy dies", async () => {
      const character = await createTestCharacter(testCtx);
      const combatStart = createCombatStartRequest(1);
      combatStart.combat_start[0].hp = 5; // Low HP enemy

      const state = await testCtx.combatService.initializeCombat(
        character,
        combatStart,
        testCtx.userId,
      );

      const enemy = state.enemies[0];

      const result = await testCtx.combatService.applyPlayerDamage(
        character.characterId,
        enemy.id,
        10, // Overkill
      );

      expect(result.state.inCombat).toBe(false);
      expect(result.endResult).toBeDefined();
      expect(result.endResult?.xp_gained).toBeGreaterThanOrEqual(0);
    });

    test("applies damage to player", async () => {
      const character = await createTestCharacter(testCtx);
      const combatStart = createCombatStartRequest(1);

      const state = await testCtx.combatService.initializeCombat(
        character,
        combatStart,
        testCtx.userId,
      );

      const initialHp = state.player.hp;

      const result = await testCtx.combatService.applyEnemyDamage(
        character.characterId,
        5,
      );

      expect(result.state.player.hp).toBe(initialHp - 5);
    });
  });

  describe("Combat End", () => {
    let testCtx: CombatTestContext;

    beforeEach(async () => {
      testCtx = await setupCombatTest([15, 10]);
    });

    afterEach(async () => {
      await teardownCombatTest(testCtx);
    });

    test("ends combat manually", async () => {
      const character = await createTestCharacter(testCtx);
      const combatStart = createCombatStartRequest(1);

      await testCtx.combatService.initializeCombat(
        character,
        combatStart,
        testCtx.userId,
      );

      await testCtx.combatService.endCombat(character.characterId);

      const isInCombat = await testCtx.combatService.isInCombat(
        character.characterId,
      );

      expect(isInCombat).toBe(false);
    });
  });
});
