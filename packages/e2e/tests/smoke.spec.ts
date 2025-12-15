import { test, expect } from '@playwright/test';

/**
 * Application Smoke Tests
 * Basic checks that the app loads and has proper structure
 */

test.describe('Application Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'e2e-test-user', exp: 4102444800 }));
      const token = `${header}.${payload}.e2e-bypass-signature`;
      localStorage.setItem('rpg-auth-token', token);
      localStorage.setItem(
        'rpg-user-data',
        JSON.stringify({
          name: 'Test User',
          displayName: 'Test User',
          email: 'test@example.com',
          picture: 'http://localhost/avatar.png',
        }),
      );
    });
  });

  test('should load the application without errors', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Check that the app div is present
    const app = page.locator('#app');
    await expect(app).toBeVisible();

    // Wait for Vue to render
    await page.waitForTimeout(1000);

    // Check that some content is rendered (title or navigation)
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('should have proper HTML structure', async ({ page }) => {
    await page.goto('/home');

    // Check meta tags
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);

    // Check title
    await expect(page).toHaveTitle(/RPG Gen/);
  });

  test('should load without critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Wait for content to potentially load
    await page.waitForTimeout(2000);

    // Check for critical errors (warnings and favicon/devtools errors are okay)
    const criticalErrors = errors.filter(
      e =>
        !e.includes('favicon') &&
        !e.includes('DevTools') &&
        !e.includes('WebSocket') &&
        !e.includes('404'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
