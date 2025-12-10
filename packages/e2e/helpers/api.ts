import { Page } from '@playwright/test';

/**
 * Backend API helper for E2E test data management
 * Equivalent to Cypress tasks for prepareE2EDb and cleanupE2EDb
 */

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3001';

export interface PrepareDbOptions {
  count?: number;
  ready?: boolean;
  withChat?: boolean;
}

/**
 * Prepare E2E database with test characters
 * Uses the backend's E2E endpoint (requires DISABLE_AUTH_FOR_E2E or test mode)
 */
export async function prepareE2EDb(options: PrepareDbOptions = {}): Promise<{ ok: boolean }> {
  const { count = 2, ready = false, withChat = false } = options;

  try {
    // Call the prepare-e2e-db script endpoint
    // This assumes you have a backend endpoint or we call the script directly
    // For now, we'll make a direct HTTP request to the backend API
    const response = await fetch(`${API_BASE}/api/test/prepare-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, ready, withChat }),
    });

    return { ok: response.ok };
  } catch (error) {
    console.error('Failed to prepare E2E DB:', error);
    return { ok: false };
  }
}

/**
 * Cleanup E2E database test data
 */
export async function cleanupE2EDb(): Promise<{ ok: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/api/test/cleanup-db`, {
      method: 'POST',
    });

    return { ok: response.ok };
  } catch (error) {
    console.error('Failed to cleanup E2E DB:', error);
    return { ok: false };
  }
}

/**
 * Setup API mocks/intercepts for a page
 * Replace cy.intercept with page.route
 */
export async function setupApiIntercepts(page: Page) {
  // Mock auth profile endpoint
  await page.route('**/api/auth/profile', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'E2E Test User',
        displayName: 'E2E Test User',
        email: 'e2e@playwright.test',
        picture: 'http://localhost/avatar.png',
      }),
    });
  });
}
