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

    // Start combat
    const combatStartResponse = await page.request.post(`/api/combat/${characterId}/start`);
    expect(combatStartResponse.ok()).toBeTruthy();
    const combatState = await combatStartResponse.json();
    expect(combatState.inCombat).toBe(true);

    // Get enemy ID
    const firstEnemy = combatState.enemies[0];
    if (!firstEnemy) {
      throw new Error("No enemies in combat");
    }

    // Attack until combat ends (max 30 attempts)
    let finalStatus = combatState;
    for (let i = 0; i < 30; i++) {
      // Attack
      const actionResponse = await page.request.post(`/api/combat/${characterId}/action`, {
        data: {
          type: "attack",
          targetId: firstEnemy.id,
        },
      });

      if (!actionResponse.ok()) {
        break; // Combat might have ended
      }

      // Check status
      const statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
      if (!statusResponse.ok()) {
        break;
      }

      finalStatus = await statusResponse.json();

      if (!finalStatus.inCombat) {
        console.log(`Combat ended after ${i + 1} attacks`);
        break;
      }
    }

    // Final assertion
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

    // Start combat
    const combatStartResponse = await page.request.post(`/api/combat/${characterId}/start`);
    expect(combatStartResponse.ok()).toBeTruthy();
    const combatState = await combatStartResponse.json();
    const firstEnemy = combatState.enemies[0];

    // Attack until victory
    for (let i = 0; i < 30; i++) {
      const actionResponse = await page.request.post(`/api/combat/${characterId}/action`, {
        data: {
          type: "attack",
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
          type: "attack",
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
