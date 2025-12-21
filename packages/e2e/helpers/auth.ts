import { Page } from "@playwright/test";

/**
 * Generate a mock JWT token with far-future expiration
 * for client-side authentication checks
 */
function generateMockToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 86400; // 24h from now

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "e2e-test-user",
    email: "e2e@playwright.test",
    exp,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const mockSignature = "mock-signature-e2e";

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

/**
 * Mock authentication for E2E tests
 * Sets token in localStorage so app thinks user is authenticated
 */
export async function mockAuthentication(page: Page) {
  // Use the page's current baseURL instead of hardcoded localhost:5173
  const baseURL = page.context().browser()?.browserType().name() === 'chromium' 
    ? (process.env.CI ? "http://localhost" : "http://localhost:5173")
    : "http://localhost:5173";
    
  await page.goto(baseURL);

  const mockToken = generateMockToken();

  await page.evaluate(token => {
    localStorage.setItem("rpg-auth-token", token);
    localStorage.setItem(
      "rpg-user-data",
      JSON.stringify({
        id: "e2e-test-user",
        email: "e2e@playwright.test",
        name: "E2E Test User",
      }),
    );
  }, mockToken);
}

/**
 * Wait for and verify authentication state
 */
export async function verifyAuthenticated(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem("rpg-auth-token"));
  if (!token) {
    throw new Error("Not authenticated");
  }
}

/**
 * Clear authentication
 * Navigates to the base URL first to ensure localStorage is accessible
 */
export async function clearAuthentication(page: Page, baseURL?: string) {
  baseURL = baseURL || (process.env.CI ? "http://localhost" : "http://localhost:5173");
  // Navigate to base URL first to ensure we have access to localStorage
  await page.goto(baseURL);
  await page.evaluate(() => {
    localStorage.removeItem("rpg-auth-token");
    localStorage.removeItem("rpg-user-data");
  });
}
