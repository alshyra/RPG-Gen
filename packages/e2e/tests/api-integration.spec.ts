import { test, expect } from '@playwright/test';

/**
 * API Integration Tests
 * Tests API error handling and offline behavior
 */

test.describe('API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle API calls gracefully', async ({ page }) => {
    // Spy on POST requests and allow real backend
    const apiCallPromise = page.waitForResponse('**/api/**');

    // App should load without immediate API calls
    await expect(page.getByText('RPG Gemini')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Stub API to return error
    await page.route('**/api/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/home');
    await expect(page.getByText('RPG Gemini')).toBeVisible();
  });

  test('should display world selector when backend is unavailable', async ({ page }) => {
    // Simulate backend outage
    await page.route('**/api/**', async route => {
      await route.abort('failed');
    });

    // Set valid JWT token for client-side auth
    await page.evaluate(() => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'offline-user', exp: 4102444800 })); // year 2100
      const signature = 'test-signature';
      const token = `${header}.${payload}.${signature}`;

      localStorage.setItem('rpg-auth-token', token);
      localStorage.setItem(
        'rpg-user-data',
        JSON.stringify({
          id: 'offline-user',
          displayName: 'Offline Tester',
        }),
      );
    });

    await page.goto('/home');

    // Basic UI should still work
    await expect(page.getByText('RPG Gemini')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Créer un personnage' })).toBeVisible();
  });
});
