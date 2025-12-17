import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../helpers/auth";
import { prepareE2EDb, cleanupE2EDb } from "../helpers/api";

/**
 * User Journey: Complete Combat Flow
 *
 * Simulates a real player experience:
 * 1. Character creation/loading
 * 2. Navigation to combat view
 * 3. Starting combat with enemies
 * 4. Multiple combat rounds (with some hits/misses)
 * 5. Victory condition (all enemies defeated)
 * 6. Victory state verification (combatEnd, narrative, inCombat=false)
 * 7. Visual verification (HP bars, arena state)
 *
 * This is the primary combat test - all combat scenarios should go through this journey
 */

test.describe("User Journey: Combat Flow (Complete)", () => {
  test.beforeAll(async () => {
    await cleanupE2EDb();
    const result = await prepareE2EDb({
      count: 1,
      ready: true,
      withChat: true,
    });
    expect(result.ok).toBe(true);
  });

  test(
    "complete journey: character -> combat start -> multiple rounds -> victory -> end state",
    {
      annotation: {
        type: "issue",
        description: "Flaky due to combat RNG - may need multiple retries",
      },
    },
    async ({ page }) => {
      // === PHASE 1: Setup & Navigation ===
      await mockAuthentication(page);

      // Load characters and select first
      const charsResponse = await page.request.get("/api/characters");
      const characters = await charsResponse.json();
      expect(characters.length).toBeGreaterThan(0);
      const characterId = characters[0].characterId;
      console.log(`[Journey] Selected character: ${characterId}`);

      // Navigate to character's game page
      await page.goto(`/character/${characterId}`);
      await page.waitForLoadState("networkidle");

      // === PHASE 2: Start Combat ===
      console.log("[Journey] Starting combat...");
      const combatStartResponse = await page.request.post(`/api/combat/${characterId}/start`, {
        data: {
          combat_start: [
            {
              name: "Goblin Scout",
              hp: 5,
              ac: 12,
              attack_bonus: 2,
              damage_dice: "1d4",
              damage_bonus: 0,
            },
          ],
        },
      });
      expect(combatStartResponse.ok()).toBe(true);
      const combatStartState = await combatStartResponse.json();
      expect(combatStartState.inCombat).toBe(true);
      expect(combatStartState.enemies.length).toBe(1);
      console.log(
        `[Journey] Combat started, enemies: ${combatStartState.enemies.map((e: any) => e.name).join(", ")}`,
      );

      // === PHASE 3: Combat Rounds (Attack until victory) ===
      let currentStatus = combatStartState;
      let roundCount = 0;
      const maxRounds = 50; // Safety limit (increased for multi-round combats)

      while (currentStatus.inCombat && roundCount < maxRounds) {
        roundCount++;
        console.log(`[Journey] Round ${roundCount}: Player attacking...`);

        // Player attacks
        const targetEnemy = currentStatus.enemies[0];
        const actionResponse = await page.request.post(`/api/combat/${characterId}/action`, {
          data: {
            actionType: "attack",
            targetId: targetEnemy.id,
          },
        });
        expect(actionResponse.ok()).toBe(true);
        const actionResult = await actionResponse.json();
        console.log(
          `[Journey] Attack result: hit=${actionResult.hit}, damage=${actionResult.damage}, desc=${actionResult.description}`,
        );

        // Check if combat ended immediately (last enemy killed)
        const statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
        currentStatus = await statusResponse.json();

        if (!currentStatus.inCombat) {
          console.log(`[Journey] Combat ended after attack!`);
          break;
        }

        // If combat still ongoing, enemy turn happens
        const endTurnResponse = await page.request.post(
          `/api/combat/${characterId}/end-player-turn`,
          {},
        );
        expect(endTurnResponse.ok()).toBe(true);
        const endTurnResult = await endTurnResponse.json();

        console.log(
          `[Journey] End turn: playerDefeated=${endTurnResult.playerDefeated}, round=${endTurnResult.roundNumber}`,
        );

        // Verify player didn't die
        expect(endTurnResult.playerDefeated).toBe(false);

        // Fetch fresh status
        const freshStatusResponse = await page.request.get(`/api/combat/${characterId}/status`);
        currentStatus = await freshStatusResponse.json();
      }

      // === PHASE 4: Victory Verification ===
      expect(currentStatus.inCombat).toBe(false);
      console.log(`[Journey] Combat ended after ${roundCount} rounds`);

      // Verify combat end data exists
      expect(currentStatus.combatEnd).toBeDefined();
      expect(currentStatus.combatEnd.victory).toBe(true);
      expect(currentStatus.combatEnd.xp_gained).toBeGreaterThan(0);
      console.log(
        `[Journey] Victory! XP gained: ${currentStatus.combatEnd.xp_gained}, Player HP: ${currentStatus.combatEnd.player_hp}`,
      );

      // Verify narrative was generated
      expect(currentStatus.narrative).toBeDefined();
      expect(currentStatus.narrative.length).toBeGreaterThan(0);
      console.log(`[Journey] Combat narrative: ${currentStatus.narrative.substring(0, 100)}...`);

      // === PHASE 5: State Consistency ===
      // Fetch status again - narrative should be persisted (not regenerated)
      const refetchResponse = await page.request.get(`/api/combat/${characterId}/status`);
      const refetchStatus = await refetchResponse.json();

      expect(refetchStatus.inCombat).toBe(false);
      expect(refetchStatus.narrative).toBe(currentStatus.narrative); // Should be identical (no regeneration)
      console.log("[Journey] ✓ State is persisted correctly (narrative consistent)");

      console.log("[Journey] ✓ Complete journey verified!");
    },
  );

  test.skip("combat with multiple enemies and varying difficulty", async ({ page }) => {
    // === Setup ===
    await mockAuthentication(page);

    const charsResponse = await page.request.get("/api/characters");
    const characters = await charsResponse.json();
    const characterId = characters[0].characterId;
    console.log(`[Multi-Enemy] Character: ${characterId}`);

    // === Start combat with multiple enemies ===
    const combatStartResponse = await page.request.post(`/api/combat/${characterId}/start`, {
      data: {
        combat_start: [
          {
            name: "Weak Goblin",
            hp: 3,
            ac: 10,
            attack_bonus: 1,
            damage_dice: "1d4",
            damage_bonus: 0,
          },
          {
            name: "Strong Goblin",
            hp: 8,
            ac: 12,
            attack_bonus: 3,
            damage_dice: "1d6",
            damage_bonus: 1,
          },
        ],
      },
    });
    expect(combatStartResponse.ok()).toBe(true);
    const combatStartState = await combatStartResponse.json();
    expect(combatStartState.inCombat).toBe(true);
    expect(combatStartState.enemies.length).toBe(2);
    console.log(`[Multi-Enemy] Started with 2 enemies`);

    // === Fight until victory ===
    let currentStatus = combatStartState;
    let roundCount = 0;

    while (currentStatus.inCombat && roundCount < 20) {
      roundCount++;

      // Attack first alive enemy
      const aliveEnemy = currentStatus.enemies.find((e: any) => (e.hp ?? 0) > 0);
      if (!aliveEnemy) break;

      const actionResponse = await page.request.post(`/api/combat/${characterId}/action`, {
        data: {
          actionType: "attack",
          targetId: aliveEnemy.id,
        },
      });
      expect(actionResponse.ok()).toBe(true);

      // Check if combat ended
      let statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
      currentStatus = await statusResponse.json();

      if (currentStatus.inCombat) {
        // End turn to allow enemies to attack
        const endTurnResponse = await page.request.post(
          `/api/combat/${characterId}/end-player-turn`,
          {},
        );

        // If end-turn failed, might mean combat already ended
        if (!endTurnResponse.ok()) {
          console.log(`[Multi-Enemy] End turn failed (combat may have ended), checking status...`);
          statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
          currentStatus = await statusResponse.json();
          break;
        }

        const endTurnResult = await endTurnResponse.json();
        expect(endTurnResult.playerDefeated).toBe(false);

        statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
        currentStatus = await statusResponse.json();
      }
    }

    // === Verify victory ===
    expect(currentStatus.inCombat).toBe(false);
    expect(currentStatus.combatEnd.victory).toBe(true);
    expect(currentStatus.enemies.every((e: any) => (e.hp ?? 0) <= 0)).toBe(true);
    console.log(`[Multi-Enemy] ✓ Victory with 2 enemies defeated after ${roundCount} rounds`);
  });

  test("combat state does not end while enemies remain alive", async ({ page }) => {
    // === Setup ===
    await mockAuthentication(page);

    const charsResponse = await page.request.get("/api/characters");
    const characters = await charsResponse.json();
    const characterId = characters[0].characterId;

    // === Start combat ===
    const combatStartResponse = await page.request.post(`/api/combat/${characterId}/start`, {
      data: {
        combat_start: [
          {
            name: "Goblin",
            hp: 20, // High HP so it survives longer
            ac: 10,
            attack_bonus: 1,
            damage_dice: "1d4",
            damage_bonus: 0,
          },
        ],
      },
    });
    const combatState = await combatStartResponse.json();
    expect(combatState.inCombat).toBe(true);

    // === Perform one turn (one attack) ===
    const targetEnemy = combatState.enemies[0];
    const actionResponse = await page.request.post(`/api/combat/${characterId}/action`, {
      data: {
        actionType: "attack",
        targetId: targetEnemy.id,
      },
    });
    const actionResult = await actionResponse.json();
    console.log(`[Enemy-Alive] Attack: hit=${actionResult.hit}, damage=${actionResult.damage}`);

    // === Verify combat is still ongoing ===
    const statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
    const currentStatus = await statusResponse.json();

    // Since enemy still has HP, combat should continue
    if ((combatState.enemies[0].hp ?? 0) - (actionResult.damage ?? 0) > 0) {
      expect(currentStatus.inCombat).toBe(true);
      expect(currentStatus.combatEnd).toBeUndefined();
      console.log(`[Enemy-Alive] ✓ Combat correctly continues while enemy alive`);
    }
  });
});
