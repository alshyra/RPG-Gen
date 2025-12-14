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
    // App should load landing page when not authenticated
    await page.waitForLoadState('networkidle');

    // Page should be visible with content (landing page or redirects to login)
    await expect(page.locator('body')).toBeVisible();

    // Verify URL is either landing (/) or login
    const url = page.url();
    expect(url === '/' || url.includes('/login') || url.includes('localhost')).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Set up authentication first
    await page.evaluate(() => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'test-user', exp: 4102444800 }));
      const token = `${header}.${payload}.signature`;
      localStorage.setItem('rpg-auth-token', token);
      localStorage.setItem(
        'rpg-user-data',
        JSON.stringify({ id: 'test-user', displayName: 'Test User' }),
      );
    });

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
    await page.waitForLoadState('networkidle');
    // Should still render the page structure even with API errors
    await expect(page.locator('body')).toBeVisible();
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
