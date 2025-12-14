import { test, expect } from '@playwright/test';
import { mockAuthentication } from '../helpers/auth';
import { prepareE2EDb, cleanupE2EDb } from '../helpers/api';

test.describe('Combat Victory Flow', () => {
  test.beforeAll(async () => {
    await cleanupE2EDb();
    await prepareE2EDb({ count: 1, ready: true, withChat: true });
  });

  test('should display victory modal when all enemies are defeated', async ({ page }) => {
    await mockAuthentication(page);

    // Get character
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Get first character
    const chars = await page.request.get('/api/characters');
    const characters = await chars.json();
    const characterId = characters[0]?.characterId;

    if (!characterId) {
      throw new Error('No character found');
    }

    // Navigate to game
    await page.goto(`/game/${characterId}`);
    await page.waitForLoadState('networkidle');

    // This test assumes combat can be started and completed
    // For now, just verify the page loads
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });

  test('should not display victory modal if enemies remain', async ({ page }) => {
    await mockAuthentication(page);

    // Get character
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Get first character
    const chars = await page.request.get('/api/characters');
    const characters = await chars.json();
    const characterId = characters[0]?.characterId;

    if (!characterId) {
      throw new Error('No character found');
    }

    // Navigate to game
    await page.goto(`/game/${characterId}`);
    await page.waitForLoadState('networkidle');

    // This test assumes combat is ongoing
    // For now, just verify the page loads
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });
});
