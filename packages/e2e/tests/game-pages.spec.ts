import { test, expect } from '@playwright/test';
import { mockAuthentication } from '../helpers/auth';
import { prepareE2EDb } from '../helpers/api';

/**
 * Game Detail Pages Tests
 * Tests navigation to inventory, spells, and other game pages
 */

test.describe('Game detail pages', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);

    // Create a character
    const result = await prepareE2EDb({ count: 1 });
    expect(result.ok).toBe(true);
  });

  test('should navigate to inventory page from sidebar', async ({ page }) => {
    // Intercept and navigate
    const charactersPromise = page.waitForResponse('**/api/characters');
    await page.goto('/home');
    await charactersPromise;

    // Click first character card to resume
    await page.locator('[role="button"][aria-label*="Reprendre"]').first().click();

    // Handle case where resume leads to character-step (draft state)
    const url = page.url();
    const match = url.match(/\/character\/([^/]+)\/step\//);
    if (match) {
      const charId = match[1];
      const characterPromise = page.waitForResponse(`**/api/characters/${charId}`);
      await page.goto(`/game/${charId}`);
      await characterPromise;
    }

    // Should be in game route
    await expect(page).toHaveURL(/\/game\/[A-Za-z0-9-]+$/);

    // Click Inventory in sidebar
    await page.getByText('Inventaire').click();

    // Inventory page should be visible
    await expect(page.getByText('Inventaire')).toBeVisible();

    // Either shows empty state or items list
    const bodyText = await page.locator('body').textContent();
    expect(
      bodyText?.includes('Aucun objet pour le moment.') || bodyText?.includes('item(s)'),
    ).toBeTruthy();
  });

  test('should navigate to spells page and show placeholder', async ({ page }) => {
    const charactersPromise = page.waitForResponse('**/api/characters');
    await page.goto('/home');
    await charactersPromise;

    // Click first character card
    await page.locator('[role="button"][aria-label*="Reprendre"]').first().click();

    // Handle draft state navigation
    const url = page.url();
    const match = url.match(/\/character\/([^/]+)\/step\//);
    if (match) {
      const charId = match[1];
      const characterPromise = page.waitForResponse(`**/api/characters/${charId}`);
      await page.goto(`/game/${charId}`);
      await characterPromise;
    }

    // Click Spells in sidebar - ensure visible and scroll
    const sortsLink = page.getByText('Sorts');
    await sortsLink.scrollIntoViewIfNeeded();
    await sortsLink.click({ force: true });

    await expect(page.getByText('Sorts')).toBeVisible();

    // For now, spells view may show empty state
    await expect(page.getByText('Aucun sort appris.')).toBeVisible();
  });
});
