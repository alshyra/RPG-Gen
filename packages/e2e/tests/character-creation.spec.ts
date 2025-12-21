import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../helpers/auth";

/**
 * Character Creation Tests
 * Tests navigation through NEW simplified 4-step character creation wizard:
 * 1. Basic Info (name, gender)
 * 2. Race Selection
 * 3. Class Selection (auto-assigns starter pack)
 * 4. Avatar
 *
 * Note: This test validates the wizard navigation flow but does NOT complete
 * the final "Terminer" action, as that requires complex backend avatar generation
 * mocking which is fragile in E2E tests. The critical path (navigation, data entry,
 * validation) is fully covered.
 */

test.describe("Character creation wizard flow (4-step)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await page.goto("/home");
    // Wait for page to be loaded
    await page.waitForLoadState("networkidle");
  });

  test("should navigate through all 4 character creation steps", async ({ page }) => {
    // Start creation
    await page.getByRole("button", { name: "+ Créer un nouveau personnage" }).click();
    await page.waitForURL(/\/character\/[^/]+\/step\/1/);

    // ========== Step 1: Basic Info (Name + Gender) ==========
    await page.locator('input[placeholder="Ex: Aragorn"]').clear();
    await page.locator('input[placeholder="Ex: Aragorn"]').fill("e2e-test-char");
    await expect(page.locator('input[placeholder="Ex: Aragorn"]')).toHaveValue("e2e-test-char");

    // Select gender (example: Homme)
    await page.getByText("♂️ Homme").click();

    // Wait for button to be enabled (debounced save happens automatically)
    const nextButton1 = page.getByRole("button", { name: "Suivant" });
    await expect(nextButton1).not.toBeDisabled({ timeout: 5000 });
    await nextButton1.click();
    await page.waitForURL(/\/step\/2/);

    // ========== Step 2: Race Selection ==========
    // Wait for race cards to load
    await page.waitForSelector('button:has-text("Humain")');
    
    // Click on Humain race card
    await page.locator('button:has-text("Humain")').first().click();
    
    // Wait for the button to be enabled (mutation + data refresh)
    const nextButton2 = page.getByRole("button", { name: "Suivant" });
    await expect(nextButton2).not.toBeDisabled({ timeout: 5000 });
    await nextButton2.click();
    await page.waitForURL(/\/step\/3/);

    // ========== Step 3: Class Selection ==========
    // Wait for class cards to load
    await page.waitForSelector('button:has-text("Guerrier")');
    
    // Click on Guerrier class card
    await page.locator('button:has-text("Guerrier")').first().click();
    
    // Wait for the button to be enabled (mutation + inventory assignment)
    const nextButton3 = page.getByRole("button", { name: "Suivant" });
    await expect(nextButton3).not.toBeDisabled({ timeout: 5000 });
    await nextButton3.click();
    await page.waitForURL(/\/step\/4/);

    // ========== Step 4: Avatar (Final Step) ==========
    // Verify we reached the last step and Terminer button exists
    const finishButton = page.getByRole("button", { name: "Terminer" });
    await expect(finishButton).toBeVisible();
    await expect(finishButton).not.toBeDisabled();
  });
});
