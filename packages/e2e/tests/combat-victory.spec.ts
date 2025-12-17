import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../helpers/auth";
import { prepareE2EDb, cleanupE2EDb } from "../helpers/api";

test.describe("Combat Victory Flow", () => {
  test.beforeAll(async () => {
    await cleanupE2EDb();
    await prepareE2EDb({ count: 1, ready: true, withChat: true });
  });

  test("should mark inCombat=false when all enemies defeated", async ({ page }) => {
    // Setup auth first
    await mockAuthentication(page);

    // Navigate to app to load auth context
    await page.goto("/home");

    // Get character via the authenticated page.request context
    const charsResponse = await page.request.get("/api/characters");
    const characters = await charsResponse.json();
    const characterId = characters[0]?.characterId;

    if (!characterId) {
      throw new Error("No character found");
    }

    // Start combat with weak enemy (easier to kill)
    const combatStartResponse = await page.request.post(`/api/combat/${characterId}/start`, {
      data: {
        combat_start: [
          {
            name: "Weak Goblin",
            hp: 3,
            ac: 8,
            attack_bonus: 0,
            damage_dice: "1d2",
            damage_bonus: -1,
          },
        ],
      },
    });
    expect(combatStartResponse.ok()).toBeTruthy();
    const combatState = await combatStartResponse.json();
    expect(combatState.inCombat).toBe(true);

    // Get enemy ID
    const firstEnemy = combatState.enemies[0];
    if (!firstEnemy) {
      throw new Error("No enemies in combat");
    }

    // Attack continuously until combat ends (weak enemy should die in 1-2 hits)
    let finalStatus = combatState;
    for (let i = 0; i < 20; i++) {
      console.log(`\n=== Attempt ${i + 1} ===`);

      // Attack
      const actionResponse = await page.request.post(`/api/combat/${characterId}/action`, {
        data: {
          actionType: "attack",
          targetId: firstEnemy.id,
        },
      });

      console.log(`Action response status: ${actionResponse.status()}`);

      if (!actionResponse.ok()) {
        console.log(`Action failed: ${await actionResponse.text()}`);
        break; // Combat might have ended
      }

      const actionResult = await actionResponse.json();
      console.log(
        `Action result: hit=${actionResult.hit}, damage=${actionResult.damage}, description=${actionResult.description}`,
      );

      // End turn to let enemies attack (or for combat to process)
      const endTurnResponse = await page.request.post(`/api/combat/${characterId}/end-turn`);
      console.log(`End turn response status: ${endTurnResponse.status()}`);

      // Small delay
      await page.waitForTimeout(100);

      // Check status
      const statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
      if (!statusResponse.ok()) {
        console.log(`Status failed: ${await statusResponse.text()}`);
        break;
      }

      finalStatus = await statusResponse.json();
      console.log(
        `Status: inCombat=${finalStatus.inCombat}, enemies=${finalStatus.enemies?.map((e: any) => `${e.name}(${e.hp}HP)`).join(", ")}`,
      );

      // If combat ended, we're done
      if (!finalStatus.inCombat) {
        console.log(`✓ Combat ended after ${i + 1} actions`);
        break;
      }
    }

    // Verify combat has ended
    expect(finalStatus.inCombat).toBe(false);
    console.log("✓ Combat correctly marked as ended");
  });

  test("should return combatEnd data with victory info", async ({ page }) => {
    await mockAuthentication(page);
    await page.goto("/home");

    const charsResponse = await page.request.get("/api/characters");
    const characters = await charsResponse.json();
    const characterId = characters[0]?.characterId;

    if (!characterId) {
      throw new Error("No character found");
    }

    // Start combat with enemies
    const combatStartResponse = await page.request.post(`/api/combat/${characterId}/start`, {
      data: {
        combat_start: [
          { name: "Goblin", hp: 5, ac: 10, attack_bonus: 2, damage_dice: "1d4", damage_bonus: 0 },
        ],
      },
    });
    expect(combatStartResponse.ok()).toBeTruthy();
    const combatState = await combatStartResponse.json();
    const firstEnemy = combatState.enemies[0];

    // Attack until victory (max 50 attempts)
    for (let i = 0; i < 50; i++) {
      const actionResponse = await page.request.post(`/api/combat/${characterId}/action`, {
        data: {
          actionType: "attack",
          targetId: firstEnemy?.id,
        },
      });

      if (!actionResponse.ok()) {
        break;
      }

      const statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
      const status = await statusResponse.json();

      if (!status.inCombat) {
        // Combat ended - verify combatEnd data
        expect(status.combatEnd).toBeDefined();
        expect(status.combatEnd.victory).toBeDefined();
        expect(typeof status.combatEnd.roundsElapsed).toBe("number");
        console.log(`✓ Combat ended with victory data: rounds=${status.combatEnd.roundsElapsed}`);
        break;
      }
    }
  });

  test("should not end combat while enemies remain", async ({ page }) => {
    await mockAuthentication(page);
    await page.goto("/home");

    const charsResponse = await page.request.get("/api/characters");
    const characters = await charsResponse.json();
    const characterId = characters[0]?.characterId;

    if (!characterId) {
      throw new Error("No character found");
    }

    // Start combat
    const combatStartResponse = await page.request.post(`/api/combat/${characterId}/start`);
    const initialState = await combatStartResponse.json();

    // If there are multiple enemies, single attack should not end combat
    if (initialState.enemies?.length > 1) {
      const actionResponse = await page.request.post(`/api/combat/${characterId}/action`, {
        data: {
          actionType: "attack",
          targetId: initialState.enemies[0]?.id,
        },
      });

      expect(actionResponse.ok()).toBeTruthy();

      const statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
      const status = await statusResponse.json();

      expect(status.inCombat).toBe(true);
      console.log("✓ Combat correctly remains active with enemies remaining");
    }
  });
});
