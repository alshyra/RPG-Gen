import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../helpers/auth";

/**
 * Character Creation Tests
 * Tests navigation through character creation wizard steps
 *
 * Note: This test validates the wizard navigation flow but does NOT complete
 * the final "Terminer" action, as that requires complex backend avatar generation
 * mocking which is fragile in E2E tests. The critical path (navigation, data entry,
 * validation) is fully covered.
 */

test.describe("Character creation wizard flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await page.goto("/home");
  });

  test("should navigate through all character creation steps", async ({ page }) => {
    // Start creation
    await page.getByRole("button", { name: "Créer un personnage" }).click();
    await page.waitForURL(/\/character\/[^/]+\/step\/1/);

    // ========== Step 1: Basic Info ==========
    await page.locator('input[placeholder="Ex: Aragorn"]').clear();
    await page.locator('input[placeholder="Ex: Aragorn"]').fill("e2e-test-char");
    await expect(page.locator('input[placeholder="Ex: Aragorn"]')).toHaveValue("e2e-test-char");

    await page.getByText("♂️ Homme").click();
    await page
      .locator("div")
      .filter({ hasText: /^Humain$/ })
      .click();

    const nextButton1 = page.getByRole("button", { name: "Suivant" });
    await expect(nextButton1).not.toBeDisabled();
    await nextButton1.click();
    await page.waitForURL(/\/step\/2/);

    // ========== Step 2: Class & Ability Scores ==========
    await page.locator("select").selectOption("Bard");
    await expect(page.locator("select")).toHaveValue("Bard");
    await expect(page.locator('[data-test-id="ability-score-Cha"]')).toBeVisible();

    // Modify ability scores
    const updateCharacterPromise = page.waitForResponse("**/api/characters/*", { timeout: 10000 });

    // Str: decrease to 8
    const strMinus = page.locator('[data-test-id="ability-score-Str"]').getByText("-");
    for (let i = 0; i < 7; i++) {
      await strMinus.click();
    }
    await expect(
      page.locator('[data-test-id=ability-score-Str] [data-test-id="ability-score"]'),
    ).toContainText("8");

    await updateCharacterPromise;

    // Navigate to skills
    const nextButton2 = page.getByRole("button", { name: "Suivant" });
    await expect(nextButton2).not.toBeDisabled();
    await nextButton2.click();
    await page.waitForURL(/\/step\/3/);

    // ========== Step 3: Skills ==========
    await page.locator('[data-testid="ui-checkbox"][for="skill-Persuasion"]').click();
    await page.locator('[data-testid="ui-checkbox"][for="skill-Stealth"]').click();
    await page.locator('[data-testid="ui-checkbox"][for="skill-Performance"]').click();

    await page.getByRole("button", { name: "Suivant" }).click();
    await page.waitForURL(/\/step\/4/);

    // ========== Step 4: Spells ==========
    // Cantrips (choose 2)
    await page.locator('label:has-text("Main de mage")').first().click();
    await page.locator('[for="spell-Message"]').click();

    // Level-1 spells (choose 4)
    await page.locator('[for="spell-Mot de guérison"]').click();
    await page.locator('[for="spell-Soins"]').click();
    await page.locator('[for="spell-Murmures dissonants"]').click();
    await page.locator('[for="spell-Sommeil"]').click();

    await page.getByRole("button", { name: "Suivant" }).click();
    await page.waitForURL(/\/step\/5/);

    // ========== Step 5: Combat ==========
    await page.getByRole("button", { name: "Suivant" }).click();
    await page.waitForURL(/\/step\/6/);

    // ========== Step 6: Inventory ==========
    await page.getByRole("button", { name: "Suivant" }).click();
    await page.waitForURL(/\/step\/7/);

    // ========== Step 7: Avatar (Final Step) ==========
    // Verify we reached the last step and Terminer button exists
    const finishButton = page.getByRole("button", { name: "Terminer" });
    await expect(finishButton).toBeVisible();
    await expect(finishButton).not.toBeDisabled();

    // ✅ Success: All 7 steps are navigable and functional
    // We intentionally DON'T click "Terminer" as it triggers:
    // - Avatar generation (complex to mock reliably)
    // - Chat session initialization
    // - Navigation to game view
    // These are better tested in integration tests or manually
  });
});
