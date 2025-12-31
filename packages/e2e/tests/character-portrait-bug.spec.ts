import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../helpers/auth";

/**
 * Test for character finalization without portrait
 * Validates fix for: "CharacterResponseDto initialized without portrait"
 */

test.describe("Character finalization without portrait", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await page.goto("/home");
    await page.waitForLoadState("networkidle");
  });

  test("should finalize character creation without portrait", async ({ page }) => {
    // Create a new character
    await page.getByRole("button", { name: "+ Créer un nouveau personnage" }).click();
    await page.waitForURL(/\/character\/[^/]+\/step\/1/);

    // Step 1: Basic Info
    await page.locator('input[placeholder="Ex: Aragorn"]').fill("Test Hero");
    await page.getByText("♂️ Homme").click();
    
    const nextButton1 = page.getByRole("button", { name: "Suivant" });
    await expect(nextButton1).not.toBeDisabled({ timeout: 5000 });
    await nextButton1.click();
    await page.waitForURL(/\/step\/2/);

    // Step 2: Race Selection
    await page.waitForSelector('button:has-text("Humain")');
    await page.locator('button:has-text("Humain")').first().click();
    
    const nextButton2 = page.getByRole("button", { name: "Suivant" });
    await expect(nextButton2).not.toBeDisabled({ timeout: 5000 });
    await nextButton2.click();
    await page.waitForURL(/\/step\/3/);

    // Step 3: Class Selection
    await page.waitForSelector('button:has-text("Rogue")');
    await page.locator('button:has-text("Rogue")').first().click();
    
    const nextButton3 = page.getByRole("button", { name: "Suivant" });
    await expect(nextButton3).not.toBeDisabled({ timeout: 5000 });
    await nextButton3.click();
    await page.waitForURL(/\/step\/4/);

    // Step 4: Talent Selection - Select first voie and stat bonus
    await page.waitForSelector('button', { timeout: 5000 });
    
    // Click on first voie (any voie)
    const firstVoie = page.locator('button').filter({ hasText: 'Voie' }).first();
    await firstVoie.click();
    
    // Click on first stat bonus (Vigueur)
    const vigorStat = page.locator('button').filter({ hasText: 'Vigueur' }).first();
    await vigorStat.click();
    
    // Wait for the button to be enabled
    const nextButton4 = page.getByRole("button", { name: "Suivant" });
    await expect(nextButton4).not.toBeDisabled({ timeout: 5000 });
    await nextButton4.click();
    await page.waitForURL(/\/step\/5/);

    // Step 5: Skip avatar generation by clicking Terminer directly
    // This will finalize the character WITHOUT setting a portrait
    const finishButton = page.getByRole("button", { name: "Terminer" });
    await expect(finishButton).toBeVisible();
    
    // Setup response listener to capture the PUT request error
    let hasError = false;
    page.on('response', response => {
      if (response.url().includes('/api/characters/') && response.request().method() === 'PUT') {
        if (response.status() === 500) {
          hasError = true;
        }
      }
    });

    // Click Terminer - this should NOT throw a 500 error about missing portrait
    await finishButton.click();

    // Wait a bit for the request to complete
    await page.waitForTimeout(2000);

    // Verify no 500 error occurred
    expect(hasError).toBe(false);

    // Should navigate to game or show success
    // (exact behavior depends on avatar generation, but no 500 error should occur)
  });
});
