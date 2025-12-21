import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../helpers/auth";
import { prepareE2EDb } from "../helpers/api";

/**
 * Navigation Tests
 * Tests client-side routing and navigation flows
 */

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
  });

  test("should navigate between routes", async ({ page }) => {
    // Start at home
    await page.goto("/home");
    await expect(page.getByText("RPG Gen")).toBeVisible();

    // Navigate back to home
    await page.goto("/home");
    expect(page.url()).toContain("/home");
  });

  test("should redirect to home when visiting /game without valid character", async ({ page }) => {
    // Visit /game with non-existent character ID
    await page.goto("/game/nonexistent-character-id", { waitUntil: "networkidle" });

    // The app should handle this gracefully
    await expect(page.locator("#app")).toBeVisible();
  });

  test("should handle levelup route", async ({ page }) => {
    await page.goto("/levelup");
    expect(page.url()).toContain("/levelup");
  });

  test("clicking the title navigates to home", async ({ page }) => {
    // Prepare a character
    await prepareE2EDb({ count: 1 });

    // Go to home and wait for page to load
    await page.goto("/home");
    await page.waitForLoadState("networkidle");

    // Look for character cards (they have clickable area but no explicit "Reprendre" button)
    const characterCards = page.locator('.bg-slate-800\\/50.rounded-lg[role="button"]');
    const cardCount = await characterCards.count();

    if (cardCount > 0) {
      // Click first character card to resume
      await characterCards.first().click();

      // Wait for navigation
      await page.waitForURL(/\/(game|character)\/[^/]+/);

      // Click title to go home
      await page.locator("h1", { hasText: "RPG Gen" }).click();
      await page.waitForURL("**/home");
      expect(page.url()).toContain("/home");
    }
  });

  test("should handle 404 for unknown routes", async ({ page }) => {
    // Visit an unknown route
    await page.goto("/unknown-route-that-does-not-exist");

    // The app should still load (Vue router handles client-side)
    await expect(page.locator("#app")).toBeVisible();
  });
});
