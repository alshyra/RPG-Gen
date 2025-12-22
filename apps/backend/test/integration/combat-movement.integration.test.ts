/**
 * Integration tests for combat grid movement and opportunity attacks.
 *
 * Tests verify:
 * - Grid initialization and position tracking
 * - Path validation (bounds, occupancy, adjacency, movement limits)
 * - Opportunity attack triggering when leaving hostile reach
 * - Active effects: 'disengaged' prevents OAs, 'dashed' doubles movement
 */
import test from "ava";
import { CombatModule } from "../../src/bounded-contexts/combat/combat.module.js";
import { CombatGridService } from "../../src/bounded-contexts/combat/domain/services/combat-grid.service.js";
import { OpportunityAttackResolver } from "../../src/bounded-contexts/combat/domain/services/opportunity-attack.service.js";
import { DiceService } from "../../src/domain/dice/dice.service.js";
import { GridPositionDto } from "../../src/bounded-contexts/combat/api/dto/response/GridPositionDto.js";
import { MovementEventType } from "../../src/bounded-contexts/combat/api/dto/response/MovementEventDto.js";
import { createTestApp, closeTestApp, type TestAppContext } from "../helpers/test-app.js";
import { createMockDiceService } from "../mocks/dice.mock.js";

// ============= Test Context =============

interface MovementTestContext {
  ctx: TestAppContext;
  gridService: CombatGridService;
  oaResolver: OpportunityAttackResolver;
}

const TEST_COMBAT_ID = "test-combat-1";
const PLAYER_ID = "player-1";
const ENEMY_ID = "enemy-1";

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

  const gridService = ctx.module.get(CombatGridService);
  const oaResolver = ctx.module.get(OpportunityAttackResolver);

  return {
    ctx,
    gridService,
    oaResolver,
  };
}

// ============= Grid Initialization Tests =============

test("should initialize grid with combatant positions", async t => {
  const { ctx, gridService } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
    { id: ENEMY_ID, position: new GridPositionDto(3, 3), reach: 1, speed: 30, isHostile: true },
  ]);

  const playerPos = gridService.getPosition(TEST_COMBAT_ID, PLAYER_ID);
  t.truthy(playerPos);
  t.is(playerPos?.x, 5);
  t.is(playerPos?.y, 5);

  const enemyPos = gridService.getPosition(TEST_COMBAT_ID, ENEMY_ID);
  t.truthy(enemyPos);
  t.is(enemyPos?.x, 3);
  t.is(enemyPos?.y, 3);

  await closeTestApp(ctx);
});

test("should return all positions for a combat", async t => {
  const { ctx, gridService } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
    { id: ENEMY_ID, position: new GridPositionDto(3, 3), reach: 1, speed: 30, isHostile: true },
  ]);

  const positions = gridService.getAllPositions(TEST_COMBAT_ID);
  t.is(positions.length, 2);
  t.true(positions.some(p => p.combatantId === PLAYER_ID));
  t.true(positions.some(p => p.combatantId === ENEMY_ID));

  await closeTestApp(ctx);
});

// ============= Path Validation Tests =============

test("should validate simple adjacent move", async t => {
  const { ctx, gridService } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
  ]);

  const path = [new GridPositionDto(5, 5), new GridPositionDto(5, 6)];
  const result = gridService.validatePath(TEST_COMBAT_ID, PLAYER_ID, path, []);

  t.true(result.valid);

  await closeTestApp(ctx);
});

test("should reject path exceeding movement speed", async t => {
  const { ctx, gridService } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(0, 0), reach: 1, speed: 3, isHostile: false },
  ]);

  // Try to move 4 tiles (exceeds speed of 3)
  const path = [
    new GridPositionDto(0, 0),
    new GridPositionDto(1, 0),
    new GridPositionDto(2, 0),
    new GridPositionDto(3, 0),
    new GridPositionDto(4, 0),
  ];
  const result = gridService.validatePath(TEST_COMBAT_ID, PLAYER_ID, path, []);

  t.false(result.valid);
  t.regex(result.error ?? "", /exceeds available speed/i);

  await closeTestApp(ctx);
});

test("should allow dash to double movement range", async t => {
  const { ctx, gridService } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(0, 0), reach: 1, speed: 3, isHostile: false },
  ]);

  // Move 6 tiles with dash (speed 3 * 2)
  const path = [
    new GridPositionDto(0, 0),
    new GridPositionDto(1, 0),
    new GridPositionDto(2, 0),
    new GridPositionDto(3, 0),
    new GridPositionDto(4, 0),
    new GridPositionDto(5, 0),
    new GridPositionDto(6, 0),
  ];
  const result = gridService.validatePath(TEST_COMBAT_ID, PLAYER_ID, path, ["dashed"]);

  t.true(result.valid);

  await closeTestApp(ctx);
});

test("should reject non-adjacent moves", async t => {
  const { ctx, gridService } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
  ]);

  // Try to jump 2 tiles
  const path = [new GridPositionDto(5, 5), new GridPositionDto(5, 7)];
  const result = gridService.validatePath(TEST_COMBAT_ID, PLAYER_ID, path, []);

  t.false(result.valid);
  t.regex(result.error ?? "", /non-adjacent/i);

  await closeTestApp(ctx);
});

test("should reject out of bounds movement", async t => {
  const { ctx, gridService } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 5, 5, [
    { id: PLAYER_ID, position: new GridPositionDto(4, 4), reach: 1, speed: 30, isHostile: false },
  ]);

  // Try to move outside grid
  const path = [new GridPositionDto(4, 4), new GridPositionDto(5, 4)];
  const result = gridService.validatePath(TEST_COMBAT_ID, PLAYER_ID, path, []);

  t.false(result.valid);
  t.regex(result.error ?? "", /out of bounds/i);

  await closeTestApp(ctx);
});

test("should reject movement through occupied tiles", async t => {
  const { ctx, gridService } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(0, 0), reach: 1, speed: 30, isHostile: false },
    { id: ENEMY_ID, position: new GridPositionDto(1, 0), reach: 1, speed: 30, isHostile: true },
  ]);

  // Try to move through enemy tile
  const path = [
    new GridPositionDto(0, 0),
    new GridPositionDto(1, 0), // occupied by enemy
    new GridPositionDto(2, 0),
  ];
  const result = gridService.validatePath(TEST_COMBAT_ID, PLAYER_ID, path, []);

  t.false(result.valid);
  t.regex(result.error ?? "", /occupied/i);

  await closeTestApp(ctx);
});

// ============= Movement Application Tests =============

test("should update position after movement", async t => {
  const { ctx, gridService } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
  ]);

  const newPos = new GridPositionDto(5, 6);
  gridService.applyMovement(TEST_COMBAT_ID, PLAYER_ID, newPos);

  const updatedPos = gridService.getPosition(TEST_COMBAT_ID, PLAYER_ID);
  t.is(updatedPos?.x, 5);
  t.is(updatedPos?.y, 6);

  await closeTestApp(ctx);
});

// ============= Opportunity Attack Tests =============

test("should trigger OA when leaving hostile reach", async t => {
  const { ctx, gridService, oaResolver } = await setupMovementTest([15, 4]); // attack roll 15, damage roll 4

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
    { id: ENEMY_ID, position: new GridPositionDto(5, 6), reach: 1, speed: 30, isHostile: true },
  ]);

  // Move away from enemy (from adjacent to non-adjacent)
  const path = [
    new GridPositionDto(5, 5),
    new GridPositionDto(4, 5), // still adjacent
    new GridPositionDto(3, 5), // leaving reach
  ];

  const statsMap = new Map([
    [PLAYER_ID, { id: PLAYER_ID, attackBonus: 3, damageDice: "1d6", damageBonus: 2, ac: 15 }],
    [ENEMY_ID, { id: ENEMY_ID, attackBonus: 4, damageDice: "1d6", damageBonus: 2, ac: 13 }],
  ]);

  const events = oaResolver.resolveOpportunityAttacks(
    TEST_COMBAT_ID,
    PLAYER_ID,
    path,
    [],
    statsMap,
  );

  t.is(events.length, 1);
  t.is(events[0].type, MovementEventType.OPPORTUNITY_ATTACK);
  t.is(events[0].actorId, ENEMY_ID);
  t.is(events[0].targetId, PLAYER_ID);
  t.true(events[0].hit);
  t.is(events[0].damage, 6); // 4 from dice + 2 bonus

  await closeTestApp(ctx);
});

test("should not trigger OA when moving within reach", async t => {
  const { ctx, gridService, oaResolver } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
    { id: ENEMY_ID, position: new GridPositionDto(5, 6), reach: 1, speed: 30, isHostile: true },
  ]);

  // Move around enemy while staying adjacent
  const path = [
    new GridPositionDto(5, 5),
    new GridPositionDto(6, 5), // still adjacent
    new GridPositionDto(6, 6), // still adjacent
  ];

  const statsMap = new Map([
    [PLAYER_ID, { id: PLAYER_ID, attackBonus: 3, damageDice: "1d6", damageBonus: 2, ac: 15 }],
    [ENEMY_ID, { id: ENEMY_ID, attackBonus: 4, damageDice: "1d6", damageBonus: 2, ac: 13 }],
  ]);

  const events = oaResolver.resolveOpportunityAttacks(
    TEST_COMBAT_ID,
    PLAYER_ID,
    path,
    [],
    statsMap,
  );

  t.is(events.length, 0);

  await closeTestApp(ctx);
});

test("should prevent OA when using disengage", async t => {
  const { ctx, gridService, oaResolver } = await setupMovementTest([]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
    { id: ENEMY_ID, position: new GridPositionDto(5, 6), reach: 1, speed: 30, isHostile: true },
  ]);

  const path = [
    new GridPositionDto(5, 5),
    new GridPositionDto(4, 5),
    new GridPositionDto(3, 5), // leaving reach
  ];

  const statsMap = new Map([
    [PLAYER_ID, { id: PLAYER_ID, attackBonus: 3, damageDice: "1d6", damageBonus: 2, ac: 15 }],
    [ENEMY_ID, { id: ENEMY_ID, attackBonus: 4, damageDice: "1d6", damageBonus: 2, ac: 13 }],
  ]);

  const events = oaResolver.resolveOpportunityAttacks(
    TEST_COMBAT_ID,
    PLAYER_ID,
    path,
    ["disengaged"],
    statsMap,
  );

  t.is(events.length, 0);

  await closeTestApp(ctx);
});

test("should record missed OA", async t => {
  const { ctx, gridService, oaResolver } = await setupMovementTest([5, 0]); // low attack roll misses

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
    { id: ENEMY_ID, position: new GridPositionDto(5, 6), reach: 1, speed: 30, isHostile: true },
  ]);

  const path = [new GridPositionDto(5, 5), new GridPositionDto(4, 5), new GridPositionDto(3, 5)];

  const statsMap = new Map([
    [PLAYER_ID, { id: PLAYER_ID, attackBonus: 3, damageDice: "1d6", damageBonus: 2, ac: 15 }],
    [ENEMY_ID, { id: ENEMY_ID, attackBonus: 4, damageDice: "1d6", damageBonus: 2, ac: 13 }],
  ]);

  const events = oaResolver.resolveOpportunityAttacks(
    TEST_COMBAT_ID,
    PLAYER_ID,
    path,
    [],
    statsMap,
  );

  t.is(events.length, 1);
  t.false(events[0].hit);
  t.is(events[0].damage, 0);

  await closeTestApp(ctx);
});

// ============= Reach Tests =============

test("should trigger OA from reach weapon at distance 2", async t => {
  const { ctx, gridService, oaResolver } = await setupMovementTest([15, 4]);

  gridService.initializeGrid(TEST_COMBAT_ID, 10, 10, [
    { id: PLAYER_ID, position: new GridPositionDto(5, 5), reach: 1, speed: 30, isHostile: false },
    { id: ENEMY_ID, position: new GridPositionDto(5, 7), reach: 2, speed: 30, isHostile: true }, // reach weapon
  ]);

  // Move away from enemy with reach weapon
  const path = [
    new GridPositionDto(5, 5),
    new GridPositionDto(5, 4), // distance 3 from enemy (leaving reach)
  ];

  const statsMap = new Map([
    [PLAYER_ID, { id: PLAYER_ID, attackBonus: 3, damageDice: "1d6", damageBonus: 2, ac: 15 }],
    [ENEMY_ID, { id: ENEMY_ID, attackBonus: 4, damageDice: "1d6", damageBonus: 2, ac: 13 }],
  ]);

  const events = oaResolver.resolveOpportunityAttacks(
    TEST_COMBAT_ID,
    PLAYER_ID,
    path,
    [],
    statsMap,
  );

  t.is(events.length, 1);
  t.is(events[0].actorId, ENEMY_ID);

  await closeTestApp(ctx);
});
