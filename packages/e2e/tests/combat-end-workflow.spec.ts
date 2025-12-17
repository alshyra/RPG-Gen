import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../helpers/auth";
import { prepareE2EDb, cleanupE2EDb } from "../helpers/api";

/**
 * Combat End-to-End Tests
 * Tests the complete combat workflow: start -> attack -> kill enemy -> return to messages
 */

test.describe("Combat End-to-End Workflow", () => {
  test.beforeAll(async () => {
    await cleanupE2EDb();
    const result = await prepareE2EDb({
      count: 1,
      ready: true,
      withChat: true,
    });
    expect(result.ok).toBe(true);
  });

  test("should complete full combat workflow: start combat -> kill enemy -> return to messages", async ({
    page,
    context,
  }) => {
    await mockAuthentication(page);

    // Get character
    const charactersPromise = page.waitForResponse("**/api/characters");
    await page.goto("/home");
    const charactersResponse = await charactersPromise;
    const chars = await charactersResponse.json();
    expect(chars.length).toBeGreaterThan(0);
    const charId = chars[0].characterId;

    // Navigate to game
    await page.goto(`/game/${charId}`);
    await page.waitForLoadState("networkidle");

    // Start combat via chat
    console.log("📌 Starting combat...");
    const chatInput = page.locator("textarea, input").last();
    await chatInput.fill("combat");
    await chatInput.press("Enter");

    // Wait for combat to start (navigate to combat page)
    // The game initiates combat and we should see combat status endpoint being called
    let combatStarted = false;
    let maxWait = 15000;
    const startTime = Date.now();

    while (!combatStarted && Date.now() - startTime < maxWait) {
      try {
        const statusResponse = await page.request.get(`/api/combat/${charId}/status`);
        if (statusResponse.ok) {
          const combatState = await statusResponse.json();
          if (combatState.inCombat) {
            combatStarted = true;
            console.log("✅ Combat started");
            console.log("Combat state:", {
              inCombat: combatState.inCombat,
              roundNumber: combatState.roundNumber,
              currentTurnIndex: combatState.currentTurnIndex,
              enemies: combatState.enemies?.map((e: any) => ({
                name: e.name,
                hp: e.hp,
                hpMax: e.hpMax,
              })),
            });
          }
        }
      } catch (e) {
        // Status endpoint might not be ready yet
      }

      if (!combatStarted) {
        await page.waitForTimeout(500);
      }
    }

    expect(combatStarted).toBeTruthy("Combat should start");

    // Get the current combat state
    const initialStatusResponse = await page.request.get(`/api/combat/${charId}/status`);
    const initialCombatState = await initialStatusResponse.json();

    const enemies = initialCombatState.enemies;
    expect(enemies.length).toBeGreaterThan(0);

    const enemy = enemies[0];
    console.log(`🎯 Target: ${enemy.name} (HP: ${enemy.hp}/${enemy.hpMax})`);

    // Attack until enemy dies
    let actionNumber = 0;
    let combatEnded = false;
    const maxActions = 50; // Safety limit

    while (!combatEnded && actionNumber < maxActions) {
      actionNumber++;
      console.log(`\n🗡️ Action ${actionNumber}: Attacking ${enemy.name}`);

      // Execute attack
      const attackResponse = await page.request.post(`/api/combat/${charId}/action`, {
        data: {
          actionType: "ATTACK",
          targetId: enemy.id,
        },
      });

      expect(attackResponse.ok).toBeTruthy(`Attack ${actionNumber} should succeed`);
      const actionResult = await attackResponse.json();

      console.log(`   Result: ${actionResult.description}`);
      if (actionResult.damage) {
        console.log(`   Damage: ${actionResult.damage}`);
      }

      // Check current combat status
      const statusResponse = await page.request.get(`/api/combat/${charId}/status`);
      expect(statusResponse.ok).toBeTruthy("Status endpoint should respond");

      const combatState = await statusResponse.json();
      console.log(`   Combat Status:`, {
        inCombat: combatState.inCombat,
        roundNumber: combatState.roundNumber,
        enemyHP: combatState.enemies[0]?.hp || 0,
      });

      // Check if all enemies are dead
      const allDead = combatState.enemies.every((e: any) => (e.hp ?? 0) <= 0);

      if (allDead) {
        console.log("✅ All enemies defeated!");
        console.log("inCombat flag:", combatState.inCombat);

        // Combat should end automatically
        if (combatState.inCombat === false) {
          combatEnded = true;
          console.log("✅ Combat properly ended (inCombat = false)");
        } else {
          console.warn("⚠️ Combat not ended yet, checking again...");
          // Wait a moment and check again
          await page.waitForTimeout(500);
        }
      }

      // End turn to let enemy act (unless it's dead)
      if (!allDead && actionNumber % 2 === 0) {
        console.log("   Ending turn for enemy...");
        const endTurnResponse = await page.request.post(`/api/combat/${charId}/end-turn`);
        if (endTurnResponse.ok) {
          console.log("   Enemy turn completed");
        }
      }
    }

    expect(combatEnded).toBeTruthy("Combat should end after defeating all enemies");
    console.log(`✅ Combat ended after ${actionNumber} actions`);

    // Verify we can return to messages (navigation should work)
    console.log("\n📍 Returning to messages page...");
    await page.goto("/messages");
    await page.waitForLoadState("networkidle");

    const messagesContent = await page.locator("body").textContent();
    expect(messagesContent).toBeTruthy("Messages page should load");
    console.log("✅ Successfully returned to messages page");

    // Optional: Verify character is no longer in combat
    const finalStatusResponse = await page.request.get(`/api/combat/${charId}/status`);
    if (finalStatusResponse.ok) {
      const finalState = await finalStatusResponse.json();
      console.log("Final combat state - inCombat:", finalState.inCombat);
    }
  });

  test("should properly handle multiple enemies in combat", async ({ page }) => {
    await mockAuthentication(page);

    // Get character
    const charactersPromise = page.waitForResponse("**/api/characters");
    await page.goto("/home");
    const charactersResponse = await charactersPromise;
    const chars = await charactersResponse.json();
    expect(chars.length).toBeGreaterThan(0);
    const charId = chars[0].characterId;

    // Navigate to game
    await page.goto(`/game/${charId}`);
    await page.waitForLoadState("networkidle");

    // Start combat
    const chatInput = page.locator("textarea, input").last();
    await chatInput.fill("battle");
    await chatInput.press("Enter");

    // Wait for combat to start
    await page.waitForTimeout(5000);

    // Get combat status
    const statusResponse = await page.request.get(`/api/combat/${charId}/status`);
    const combatState = await statusResponse.json();

    if (combatState.inCombat && combatState.enemies.length > 1) {
      console.log(`🎮 Combat with ${combatState.enemies.length} enemies`);

      // Kill each enemy sequentially
      for (const enemy of combatState.enemies) {
        console.log(`🗡️ Targeting ${enemy.name}`);

        while ((enemy.hp ?? 0) > 0) {
          // Get current state
          const currentStatus = await page.request.get(`/api/combat/${charId}/status`);
          const current = await currentStatus.json();

          if (current.inCombat === false) {
            console.log("✅ Combat ended (all enemies defeated)");
            break;
          }

          // Attack
          const attackResponse = await page.request.post(`/api/combat/${charId}/action`, {
            data: {
              actionType: "ATTACK",
              targetId: enemy.id,
            },
          });

          expect(attackResponse.ok).toBeTruthy();

          // Check if all enemies are dead
          const afterAttack = await page.request.get(`/api/combat/${charId}/status`);
          const afterState = await afterAttack.json();

          const allDead = afterState.enemies.every((e: any) => (e.hp ?? 0) <= 0);
          if (allDead) {
            console.log("✅ All enemies defeated!");
            expect(afterState.inCombat).toBe(false);
            break;
          }

          // End turn
          await page.request.post(`/api/combat/${charId}/end-turn`);
          await page.waitForTimeout(300);
        }

        if (combatState.inCombat === false) {
          break;
        }
      }
    }
  });
});
