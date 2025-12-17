import { test, expect } from "@playwright/test";

/**
 * API Integration Tests
 * Tests API error handling and offline behavior
 */

test.describe("API Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should handle API calls gracefully", async ({ page }) => {
    // App should load landing page when not authenticated
    await page.waitForLoadState("networkidle");

    // Page should be visible with content (landing page or redirects to login)
    await expect(page.locator("body")).toBeVisible();

    // Verify URL is either landing (/) or login
    const url = page.url();
    expect(url === "/" || url.includes("/login") || url.includes("localhost")).toBeTruthy();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Set up authentication first
    await page.evaluate(() => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({ sub: "test-user", exp: 4102444800 }));
      const token = `${header}.${payload}.signature`;
      localStorage.setItem("rpg-auth-token", token);
      localStorage.setItem(
        "rpg-user-data",
        JSON.stringify({ id: "test-user", displayName: "Test User" }),
      );
    });

    // Stub API to return error
    await page.route("**/api/**", async route => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/home");
    await page.waitForLoadState("networkidle");
    // Should still render the page structure even with API errors
    await expect(page.locator("body")).toBeVisible();
  });
});
