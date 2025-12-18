import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../helpers/auth";
import { prepareE2EDb, cleanupE2EDb } from "../helpers/api";

/**
 * User Journey: Complete Combat Flow
 *
 * Simulates a real player experience using exposed window methods:
 * 1. Character creation/loading (API setup - allowed)
 * 2. Navigation to combat view (UI)
 * 3. Starting combat (API setup - allowed)
 * 4. Multiple combat rounds via window.__e2eCombat (simulates canvas clicks)
 * 5. Victory modal verification (UI)
 *
 * The frontend exposes window.__e2eCombat with:
 * - attack(targetId, spellName?) - simulates clicking enemy + choosing attack
 * - endTurn() - simulates end turn button
 * - getStatus() - gets current combat state
 * - refetch() - forces query refresh
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
      timeout: 120_000, // 120 seconds to allow for slow page loads and component initialization
      annotation: {
        type: "issue",
        description: "Flaky due to combat RNG - may need multiple retries",
      },
    },
    async ({ page }) => {
      // === PHASE 1: Setup & Navigation ===
      await mockAuthentication(page);

      // Capture browser console logs
      page.on("console", msg => {
        const text = msg.text();
        if (
          text.includes("[E2E]") ||
          text.includes("[useCombat") ||
          text.includes("executeAttack")
        ) {
          console.log(`  [Browser] ${text}`);
        }
      });

      // Load characters and select first
      const charsResponse = await page.request.get("/api/characters");
      const characters = await charsResponse.json();
      expect(characters.length).toBeGreaterThan(0);
      const characterId = characters[0].characterId;
      console.log(`[Journey] Selected character: ${characterId}`);

      // Navigate to home first to ensure frontend app loads properly
      await page.goto("/home", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      // Navigate to character's game page (REAL UI navigation)
      await page.goto(`/game/${characterId}/messages`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);

      // === PHASE 2: Start Combat (via API to control enemy stats) ===
      console.log("[Journey] Starting combat...");
      const combatStartResponse = await page.request.post(`/api/combat/${characterId}/start`, {
        data: {
          combat_start: [
            {
              name: "Goblin Scout",
              hp: 1, // Very low HP so player wins quickly
              ac: 5, // Very low AC so attacks always hit
              attack_bonus: -10, // Very low bonus so enemy can't hit
              damage_dice: "1d1",
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

      // Navigate to combat route first
      // After starting combat via API, navigate to the combat view
      await page.goto(`/game/${characterId}/combat`, { waitUntil: "domcontentloaded" });

      // Wait for E2E combat API to be exposed by CombatPanel
      await page.waitForFunction(() => window.__e2eCombat !== undefined, { timeout: 10000 });
      console.log("[Journey] ✓ E2E Combat API is available on window");

      // Force frontend to refresh combat state after API start
      await page.evaluate(() => window.__e2eCombat?.refetch());
      await page.waitForTimeout(1000);

      // Verify combat is active via E2E API
      const initialStatus = await page.evaluate(() => window.__e2eCombat?.getStatus());
      console.log(
        `[Journey] Combat status: inCombat=${initialStatus?.inCombat}, enemies=${initialStatus?.enemies?.length}`,
      );
      expect(initialStatus?.inCombat).toBe(true);
      expect(initialStatus?.enemies?.length).toBeGreaterThan(0);

      console.log("[Journey] ✓ Navigated to combat route and combat is active");

      // === PHASE 3: Combat Rounds (via window.__e2eCombat - simulates UI) ===
      let roundCount = 0;
      const maxRounds = 10;

      while (roundCount < maxRounds) {
        roundCount++;

        // Refetch to get fresh status (especially actionRemaining)
        await page.evaluate(() => window.__e2eCombat?.refetch());
        await page.waitForTimeout(300);

        // Get current status with more details
        const status = await page.evaluate(() => {
          const api = window.__e2eCombat;
          if (!api) return null;
          const s = api.getStatus();
          // Also get actionRemaining from the raw data
          const qc = (window as any).__vueQueryClient;
          let actionRemaining = 0;
          if (qc) {
            const queries = qc.getQueryCache().getAll();
            const combatQuery = queries.find((q: any) => q.queryKey[0] === "combat");
            actionRemaining = combatQuery?.state?.data?.actionRemaining ?? 0;
          }
          return { ...s, actionRemaining };
        });

        if (!status?.inCombat) {
          console.log(`[Journey] ✓ Combat ended after ${roundCount - 1} rounds`);
          break;
        }

        const targetEnemy = status.enemies[0];
        if (!targetEnemy) {
          console.log("[Journey] No enemies left");
          break;
        }

        console.log(
          `[Journey] Round ${roundCount}: Attacking ${targetEnemy.name} (HP: ${targetEnemy.hp}, actionRemaining: ${status.actionRemaining})...`,
        );

        // Attack via E2E API (simulates clicking enemy on canvas + choosing attack)
        try {
          await page.evaluate(targetId => window.__e2eCombat?.attack(targetId), targetEnemy.id);
        } catch (e) {
          console.log(`[Journey] Attack error: ${e}`);
        }
        await page.waitForTimeout(500);

        // End turn via E2E API (simulates end turn button)
        await page.evaluate(() => window.__e2eCombat?.endTurn());
        await page.waitForTimeout(500);

        console.log(`[Journey] ✓ Attack and end turn completed`);
      }

      // === PHASE 4: Victory Modal Verification (UI) ===
      // Wait for backend to process combat end
      await page.waitForTimeout(1000);

      // Poll backend API directly until combat ends
      let backendStatus;
      for (let i = 0; i < 10; i++) {
        const statusResponse = await page.request.get(`/api/combat/${characterId}/status`);
        backendStatus = await statusResponse.json();
        if (!backendStatus.inCombat) {
          console.log(`[Journey] Backend confirmed combat ended after ${i + 1} polls`);
          break;
        }
        await page.waitForTimeout(500);
      }

      // Now refetch frontend to sync with backend
      await page.evaluate(() => window.__e2eCombat?.refetch());
      await page.waitForTimeout(1000); // Wait for narrative generation (Gemini API call)

      // Re-refetch to get the narrative
      await page.evaluate(() => window.__e2eCombat?.refetch());
      await page.waitForTimeout(500);

      // Verify combat ended via E2E API
      const finalStatus = await page.evaluate(() => window.__e2eCombat?.getStatus());
      console.log(
        `[Journey] Final status: inCombat=${finalStatus?.inCombat}, combatEnd=${!!finalStatus?.combatEnd}`,
      );
      expect(finalStatus?.inCombat).toBe(false);
      expect(finalStatus?.combatEnd).toBeTruthy();

      const modal = page.locator(".combat-end-modal");

      // Modal should appear after watcher triggers
      await expect(modal).toBeVisible({ timeout: 5000 });
      console.log("[Journey] ✓ Victory modal is visible");

      // Verify narrative is displayed in modal
      const narrativeText = page.locator(".narrative-text");
      await expect(narrativeText).toBeVisible({ timeout: 10000 }); // Longer timeout for narrative
      const textContent = await narrativeText.textContent();
      expect(textContent).toBeTruthy();
      console.log("[Journey] ✓ Narrative is displayed in modal");

      // Click "Continuer" button to dismiss modal
      // Use force:true because chat bar overlay may intercept pointer events
      const continueButton = page.getByRole("button", { name: /continuer/i });
      await expect(continueButton).toBeVisible();
      await continueButton.click({ force: true });
      console.log("[Journey] ✓ Clicked 'Continuer' button");

      // Verify we're redirected to messages page
      await page.waitForURL(`**/game/${characterId}/messages`, { timeout: 5000 });
      expect(page.url()).toContain("/messages");
      console.log("[Journey] ✓ Redirected to messages page");

      // === PHASE 5: Verify narrative appears in messages ===
      // Wait for messages to render
      await page.waitForTimeout(1000);

      // Get the narrative from the modal that we saw earlier
      const modalNarrative = textContent;

      // Find all message blocks in the messages view
      const messageBlocks = page.locator(".space-y-3 > div");
      const messageCount = await messageBlocks.count();
      expect(messageCount).toBeGreaterThan(0);
      console.log(`[Journey] Found ${messageCount} messages in messages view`);

      // Get the last message (should be the combat end narrative)
      const lastMessage = messageBlocks.last();
      await expect(lastMessage).toBeVisible();

      // The last message should contain the narrative from combat end
      const lastMessageText = await lastMessage.textContent();
      expect(lastMessageText).toContain(modalNarrative);
      console.log("[Journey] ✓ Combat end narrative appears as last message in messages view");

      // Verify messages pane is scrolled to bottom
      const isScrolledToBottom = await page.evaluate(() => {
        const pane = document.querySelector(".flex-1.overflow-auto") as HTMLElement;
        if (!pane) return false;
        const threshold = 10; // Allow small margin
        return pane.scrollHeight - pane.scrollTop - pane.clientHeight <= threshold;
      });
      expect(isScrolledToBottom).toBe(true);
      console.log("[Journey] ✓ Messages view is scrolled to bottom");

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
        const endTurnResponse = await page.request.post(`/api/combat/${characterId}/end-turn`, {});

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
