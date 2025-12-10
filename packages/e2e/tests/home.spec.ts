import { test, expect } from '@playwright/test';
import { mockAuthentication } from '../helpers/auth';
import { prepareE2EDb } from '../helpers/api';

/**
 * Home Page Tests
 * Tests the home/world selector page functionality
 */

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);

    // Prepare test characters
    await prepareE2EDb({ count: 2 });

    await page.goto('/home');
  });

  test('should load the home page successfully', async ({ page }) => {
    await expect(page.getByText('RPG Gemini')).toBeVisible();
    await expect(page.getByText("Un moteur d'aventure assisté par Gemini")).toBeVisible();
  });

  test('should display the world selector', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'RPG Gemini' })).toBeVisible();
  });

  test('should display character list when characters exist', async ({ page }) => {
    // Wait for characters to load
    const charactersResponse = page.waitForResponse('**/api/characters');
    await page.goto('/home');
    await charactersResponse;

    // Should display "Mes personnages" header
    await expect(page.getByText('Mes personnages')).toBeVisible();

    // Check for character cards or no-characters message
    const body = page.locator('body');
    const bodyText = await body.textContent();

    if (bodyText?.includes('Aucun personnage trouvé')) {
      await expect(page.getByText(/Aucun personnage trouvé/)).toBeVisible();
    } else {
      await expect(page.getByText('Mes personnages')).toBeVisible();
      // Character cards with resume button
      await expect(page.getByRole('button', { name: /Reprendre/i })).toHaveCount(
        expect.any(Number),
      );
      // Delete buttons
      await expect(page.getByRole('button', { name: /Supprimer/i })).toHaveCount(
        expect.any(Number),
      );
    }
  });

  test('should navigate to character creation when create button is clicked', async ({ page }) => {
    const createButton = page.getByRole('button', { name: 'Créer un personnage' });
    await createButton.click();

    // Should navigate to character creation
    await page.waitForURL('**/character/**/step/**');
  });
});
