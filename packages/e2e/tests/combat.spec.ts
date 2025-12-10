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

    // Navigate directly to game route
    await page.goto(`/${charId}/game`);

    // Wait for combat status
    const combatStatusPromise = page.waitForResponse('**/api/combat/*/status', { timeout: 10000 });
    await combatStatusPromise;

    // Combat Panel should be visible with arena
    await expect(page.locator('[data-cy="combat-panel"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-cy="combat-arena"]')).toBeVisible({ timeout: 5000 });

    // Check that PixiJS canvas was created
    const canvas = page.locator('[data-cy="combat-arena"] canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Verify combat state via API
    const combatStatusResponse = await page.waitForResponse('**/api/combat/*/status');
    const combatStatus = await combatStatusResponse.json();

    expect(combatStatus.inCombat).toBe(true);
    expect(combatStatus.enemies).toBeInstanceOf(Array);
    expect(combatStatus.enemies.length).toBeGreaterThan(0);
    expect(combatStatus.player).toBeDefined();
    expect(typeof combatStatus.player.hp).toBe('number');

    // Check that combat header displays round number
    await expect(page.locator('[data-cy="combat-round"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-cy="combat-round"]')).toContainText('Round');
  });
});
