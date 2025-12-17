import { test, expect } from "@playwright/test";
import { mockAuthentication, clearAuthentication } from "../helpers/auth";

/**
 * Authentication Flow Tests
 * Tests authentication, routing protection, and login/logout flows
 */

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthentication(page);
  });

  test("should display landing page when not authenticated", async ({ page }) => {
    await page.goto("/");

    // Should see landing page
    expect(page.url()).not.toContain("/login");
    // Use role to target specific heading (more specific than text search)
    await expect(page.getByRole("heading", { name: "RPG Gen" }).nth(1)).toBeVisible();
    await expect(page.getByText("Vivez des aventures épiques générées par l'IA")).toBeVisible();
    await expect(page.getByText("Commencer à jouer")).toBeVisible();
  });

  test.describe("With mocked authentication", () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthentication(page);
    });

    test("should access home page (world selector) when authenticated", async ({ page }) => {
      await page.goto("/home");

      // Should not redirect to login
      expect(page.url()).not.toContain("/login");
      expect(page.url()).toContain("/home");

      // Should see home page content (get first RPG Gen title)
      await expect(page.getByText("RPG Gen").first()).toBeVisible();
    });

    test("should redirect authenticated users from login to home", async ({ page }) => {
      await page.goto("/login");

      // Should redirect to home
      await page.waitForURL("**/home");
      expect(page.url()).not.toContain("/login");
    });

    test("should display user profile when authenticated", async ({ page }) => {
      await page.goto("/home");

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // User profile should be visible - look for any user indicator
      // The exact element might vary, so check for common profile elements
      const hasProfileMenu =
        (await page
          .locator('[data-testid="user-profile"], .user-profile, button:has-text("E2E")')
          .count()) > 0;
      const hasUsername = (await page.getByText("E2E", { exact: false }).count()) > 0;

      // At least one profile indicator should be present
      expect(hasProfileMenu || hasUsername).toBeTruthy();
    });
  });
});
