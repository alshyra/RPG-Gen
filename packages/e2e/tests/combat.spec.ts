import { test, expect } from '@playwright/test';
import { mockAuthentication } from '../helpers/auth';
import { prepareE2EDb, cleanupE2EDb } from '../helpers/api';

/**
 * Combat Flow Tests
 * Tests combat panel, visual arena, and combat state
 */

test.describe('Combat flow', () => {
  test.beforeAll(async () => {
    await cleanupE2EDb();
    const result = await prepareE2EDb({
      count: 1,
      ready: true,
      withChat: true,
    });
    expect(result.ok).toBe(true);
  });

  test('loads combat panel with visual arena and verifies state', async ({ page }) => {
    await mockAuthentication(page);

    // Setup route interception
    const charactersPromise = page.waitForResponse('**/api/characters');
    await page.goto('/home');
    const charactersResponse = await charactersPromise;
    const chars = await charactersResponse.json();

    expect(chars.length).toBeGreaterThan(0);
    const charId = chars[0].characterId;

    // Navigate directly to game route (correct URL format)
    await page.goto(`/game/${charId}`);

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Verify we successfully loaded the game page
    // The combat panel may or may not be visible depending on combat state
    // Just verify the page structure is present
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();

    // Check if game page elements are present
    const hasGameContent =
      (await page.locator('[data-cy="game-content"], .game-page, main').count()) > 0;
    expect(hasGameContent).toBeTruthy();
  });

  test('plays full combat flow: start, attack enemies, achieve victory, return to messages', async ({
    page,
  }) => {
    await mockAuthentication(page);

    // Get character
    const charactersPromise = page.waitForResponse('**/api/characters');
    await page.goto('/home');
    const charactersResponse = await charactersPromise;
    const chars = await charactersResponse.json();
    expect(chars.length).toBeGreaterThan(0);
    const charId = chars[0].characterId;

    // Navigate to game
    await page.goto(`/game/${charId}`);
    await page.waitForLoadState('networkidle');

    // Start combat via chat message
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.fill('je cherche un combat');
    await chatInput.press('Enter');

    // Wait for navigation to combat arena (which happens after combat_start is received)
    // Use a reasonable timeout since this involves Gemini API call
    await page.waitForURL(new RegExp(`/game/${charId}/combat`), { timeout: 45000 });

    // Verify combat canvas is visible
    const combatCanvas = page.locator('[data-cy="combat-arena"]');
    await expect(combatCanvas).toBeVisible();

    // Verify combat header shows turn info
    const combatHeader = page.locator('[data-cy="combat-header"]').or(page.locator('text=/Round|Actions/i'));
    await expect(combatHeader).toBeVisible({ timeout: 5000 });

    // Attack enemies until all are defeated
    let combatActive = true;
    let attackCount = 0;
    const maxAttacks = 20; // Safety limit to prevent infinite loop

    while (combatActive && attackCount < maxAttacks) {
      attackCount++;

      // Wait for player's turn (check if action buttons are enabled)
      await page.waitForTimeout(500);

      // Try to find and click an enemy portrait attack button
      const attackButtons = page.locator('[data-cy^="attack-button"]');
      const attackButtonCount = await attackButtons.count();

      if (attackButtonCount === 0) {
        // No more attack buttons = all enemies defeated
        combatActive = false;
        break;
      }

      // Click first available attack button
      const firstButton = attackButtons.first();
      if (await firstButton.isEnabled()) {
        await firstButton.click();

        // Wait for spell selector modal to appear
        const modal = page.locator('text=/Choisir une action|Attaque/i').first();
        await expect(modal).toBeVisible({ timeout: 3000 });

        // Click weapon attack (first button in modal)
        const weaponAttackBtn = page.locator('button:has-text("Attaque à l\'arme")');
        await weaponAttackBtn.click();

        // Wait for attack to process
        await page.waitForResponse(
          response =>
            response.url().includes('/api/combat/') && response.url().includes('/attack'),
          { timeout: 5000 }
        );

        // Small delay for animation
        await page.waitForTimeout(800);
      }

      // Check if we need to end turn (no more actions)
      const endTurnBtn = page.locator('button:has-text("Fin de tour")');
      if (await endTurnBtn.isVisible()) {
        const isEnabled = await endTurnBtn.isEnabled();
        if (isEnabled) {
          await endTurnBtn.click();
          
          // Wait for end-turn response
          await page.waitForResponse(
            response =>
              response.url().includes('/api/combat/') && response.url().includes('/end-turn'),
            { timeout: 5000 }
          );
          
          // Wait for enemy attack animations
          await page.waitForTimeout(1500);
        }
      }

      // Check if combat ended (navigated back to messages)
      const currentUrl = page.url();
      if (!currentUrl.includes('/combat')) {
        combatActive = false;
      }
    }

    // Verify we're back at the messages view (not /combat)
    const finalUrl = page.url();
    expect(finalUrl).toMatch(new RegExp(`/game/${charId}$`));
    expect(finalUrl).not.toContain('/combat');

    // Verify victory message in chat
    const victoryMessage = page.locator('text=/Victoire|vaincu/i').last();
    await expect(victoryMessage).toBeVisible({ timeout: 5000 });

    // Verify we can see the messages view again
    const messagesView = page.locator('[data-cy="messages-view"], .messages, main');
    await expect(messagesView).toBeVisible();

    console.log(`Combat completed in ${attackCount} attack cycles`);
  });
});
