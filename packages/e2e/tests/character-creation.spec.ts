import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../helpers/auth";

/**
 * Character Creation Tests
 * Tests the complete 5-step character creation wizard flow:
 * 1. Basic Info (name, gender)
 * 2. Race Selection
 * 3. Class Selection (auto-assigns starter pack)
 * 4. Talent Selection (first voie + stat bonus)
 * 5. Avatar
 * 
 * Then verifies navigation to game page after completion.
 */

test.describe("Character creation wizard flow (5-step)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await page.goto("/home");
    // Wait for page to be loaded
    await page.waitForLoadState("networkidle");
  });

  test("should complete full character creation and navigate to game", async ({ page }) => {
    // Increase timeout for this test as it involves avatar generation
    test.setTimeout(120_000);
    
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

    // ========== Step 4: Talent Selection ==========
    // Wait for voies to load
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

    // ========== Step 5: Avatar (Final Step) ==========
    // Verify we reached the last step and Terminer button exists
    const finishButton = page.getByRole("button", { name: "Terminer" });
    await expect(finishButton).toBeVisible();
    await expect(finishButton).not.toBeDisabled();
    
    // Click Terminer to complete creation
    // This triggers: selectFirstTalent -> generateAvatar -> saveFinalCharacter -> navigateToGame
    await finishButton.click();
    
    // Wait for navigation to game page (avatar generation can take time)
    // The URL should change to /game/{characterId}
    await page.waitForURL(/\/game\/[^/]+/, { timeout: 60_000 });
    
    // Verify we're on the game page
    await expect(page).toHaveURL(/\/game\//);
    
    // ========== Verify character data via backend API ==========
    // Extract characterId from URL
    const url = page.url();
    const characterIdMatch = url.match(/\/game\/([^/]+)/);
    expect(characterIdMatch).toBeTruthy();
    const characterId = characterIdMatch![1];
    
    // Fetch character data from backend
    const characterResponse = await page.request.get(`/api/characters/${characterId}`);
    expect(characterResponse.ok()).toBeTruthy();
    const character = await characterResponse.json();
    
    // Verify basic info
    expect(character.name).toBe("e2e-test-char");
    expect(character.raceId).toBe("humain");
    expect(character.className).toBe("guerrier");
    expect(character.state).toBe("created");
    
    // Verify stats are set (Guerrier should have vigor as main stat)
    expect(character.stats).toBeDefined();
    expect(character.stats.vigor).toBeGreaterThan(0);
    expect(character.stats.finesse).toBeGreaterThan(0);
    expect(character.stats.mind).toBeGreaterThan(0);
    expect(character.stats.survival).toBeGreaterThan(0);
    
    // Verify PA/PM are set
    expect(character.pa).toBeDefined();
    expect(character.pa.current).toBeGreaterThan(0);
    expect(character.pm).toBeDefined();
    expect(character.pm.current).toBeGreaterThan(0);
    
    // Verify voies are populated (should have at least one voie with rank >= 1)
    expect(character.voies).toBeDefined();
    expect(character.voies.length).toBeGreaterThan(0);
    
    const unlockedVoie = character.voies.find((v: { currentRank: number }) => v.currentRank >= 1);
    expect(unlockedVoie).toBeTruthy();
    expect(unlockedVoie.currentRank).toBeGreaterThanOrEqual(1);
    
    // Verify aptitudes are populated (at least one from the unlocked voie)
    expect(character.aptitudes).toBeDefined();
    expect(character.aptitudes.length).toBeGreaterThan(0);
    
    // Verify first aptitude has required fields
    const firstAptitude = character.aptitudes[0];
    expect(firstAptitude.aptitudeId).toBeDefined();
    expect(firstAptitude.name).toBeDefined();
    expect(firstAptitude.paCost).toBeDefined();
  });
});
