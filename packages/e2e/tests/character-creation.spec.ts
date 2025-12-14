import { test, expect } from '@playwright/test';
import { mockAuthentication } from '../helpers/auth';

/**
 * Character Creation Tests
 * Tests the full character creation flow
 */

test.describe('Character creation single flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);

    // Stub avatar generator globally
    await page.route('**/api/image/generate-avatar', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ imageUrl: 'data:image/png;base64,dummy' }),
      });
    });

    await page.goto('/home');
  });

  test('should allow user to create a character', async ({ page }) => {
    // Start creation
    await page.getByRole('button', { name: 'Créer un personnage' }).click();
    await page.waitForURL(/\/character\/[^/]+\/step\/1/);

    // Basic info - Step 1
    await page.locator('input[placeholder="Ex: Aragorn"]').clear();
    await page.locator('input[placeholder="Ex: Aragorn"]').fill('e2e-character');
    await expect(page.locator('input[placeholder="Ex: Aragorn"]')).toHaveValue('e2e-character');

    await page.getByText('♂️ Homme').click();
    await page
      .locator('div')
      .filter({ hasText: /^Humain$/ })
      .click();

    const nextButton1 = page.getByRole('button', { name: 'Suivant' });
    await expect(nextButton1).not.toBeDisabled();
    await nextButton1.click();

    // Class selection + ability scores - Step 2
    await page.locator('select').selectOption('Bard');
    await expect(page.locator('select')).toHaveValue('Bard');
    await expect(page.locator('[data-test-id="ability-score-Cha"]')).toBeVisible();

    // Persist ability changes
    const updateCharacterPromise = page.waitForResponse('**/api/characters/*', { timeout: 10000 });

    // Str: decrease to 8
    const strMinus = page.locator('[data-test-id="ability-score-Str"]').getByText('-');
    for (let i = 0; i < 7; i++) {
      await strMinus.click();
    }
    await expect(
      page.locator('[data-test-id=ability-score-Str] [data-test-id="ability-score"]'),
    ).toContainText('8');

    // Dex: increase to 15
    await page.locator('[data-test-id="ability-score-Dex"]').getByText('+').click();
    await expect(
      page.locator('[data-test-id=ability-score-Dex] [data-test-id="ability-score"]'),
    ).toContainText('15');

    // Int: decrease to 10
    const intMinus = page.locator('[data-test-id="ability-score-Int"]').getByText('-');
    await intMinus.click();
    await intMinus.click();
    await expect(
      page.locator('[data-test-id=ability-score-Int] [data-test-id="ability-score"]'),
    ).toContainText('10');

    // Cha: increase to 15
    const chaPlus = page.locator('[data-test-id="ability-score-Cha"]').getByText('+');
    for (let i = 0; i < 7; i++) {
      await chaPlus.click();
    }
    await expect(
      page.locator('[data-test-id=ability-score-Cha] [data-test-id="ability-score"]'),
    ).toContainText('15');

    await updateCharacterPromise;

    // Skills - Step 3
    const nextButton2 = page.getByRole('button', { name: 'Suivant' });
    await expect(nextButton2).not.toBeDisabled();
    await nextButton2.click();

    // Select specific skills
    await page.locator('[data-testid="ui-checkbox"][for="skill-Persuasion"]').click();
    await page.locator('[data-testid="ui-checkbox"][for="skill-Stealth"]').click();
    await page.locator('[data-testid="ui-checkbox"][for="skill-Performance"]').click();

    await page.getByRole('button', { name: 'Suivant' }).click();

    // Spells - Step 4
    // Click on spell labels to select them (Vue custom checkbox behavior)
    // Cantrips (choose 2): Main de mage, Message
    await page.locator('label:has-text("Main de mage")').first().click();
    await page.locator('[for="spell-Message"]').click();

    // Level-1 spells (choose 4): Mot de guérison, Soins, Murmures dissonants, Sommeil
    await page.locator('[for="spell-Mot de guérison"]').click();
    await page.locator('[for="spell-Soins"]').click();
    await page.locator('[for="spell-Murmures dissonants"]').click();
    await page.locator('[for="spell-Sommeil"]').click();

    await page.getByRole('button', { name: 'Suivant' }).click();

    // Inventory - Step 5
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Finish - Step 6
    const updateCharacterFinishPromise = page.waitForResponse('**/api/characters/*');
    const avatarGenerationPromise = page.waitForResponse('**/api/image/generate-avatar');

    const finishButton = page.getByRole('button', { name: 'Terminer' });
    await expect(finishButton).not.toBeDisabled();
    await finishButton.click();

    // Wait for final save and avatar generation
    await updateCharacterFinishPromise;
    await avatarGenerationPromise;

    // Should navigate to game
    await page.waitForURL(/\/game\/[^/]+/);
  });
});
