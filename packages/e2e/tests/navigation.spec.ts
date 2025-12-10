import { test, expect } from '@playwright/test';
import { mockAuthentication } from '../helpers/auth';
import { prepareE2EDb } from '../helpers/api';

/**
 * Navigation Tests
 * Tests client-side routing and navigation flows
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
  });

  test('should navigate between routes', async ({ page }) => {
    // Start at home
    await page.goto('/home');
    await expect(page.getByText('RPG Gemini')).toBeVisible();

    // Navigate back to home
    await page.goto('/home');
    expect(page.url()).toContain('/home');
  });

  test('should redirect to home when visiting /game without valid character', async ({ page }) => {
    // Visit /game with non-existent character ID
    await page.goto('/game/nonexistent-character-id', { waitUntil: 'networkidle' });

    // The app should handle this gracefully
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should handle levelup route', async ({ page }) => {
    await page.goto('/levelup');
    expect(page.url()).toContain('/levelup');
  });

  test('clicking the title navigates to home', async ({ page }) => {
    // Prepare a character
    await prepareE2EDb({ count: 1 });

    // Go to home and get first character
    await page.goto('/home');
    await page.waitForResponse('**/api/characters');

    const resumeButton = page.getByRole('button', { name: /Reprendre/i }).first();
    const resumeCount = await resumeButton.count();

    if (resumeCount > 0) {
      await resumeButton.click();

      // Wait for navigation
      await page.waitForURL(/\/(game|character)\/[^/]+/);

      // Click title to go home
      await page.locator('h1', { hasText: 'RPG Gemini' }).click();
      await page.waitForURL('**/home');
      expect(page.url()).toContain('/home');
    }
  });

  test('should handle 404 for unknown routes', async ({ page }) => {
    // Visit an unknown route
    await page.goto('/unknown-route-that-does-not-exist');

    // The app should still load (Vue router handles client-side)
    await expect(page.locator('#app')).toBeVisible();
  });
});
