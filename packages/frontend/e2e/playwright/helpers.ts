import { Page } from '@playwright/test';

/**
 * Generate a mock JWT token with far-future expiration
 * Format: header.payload.signature (we only need a valid payload for client-side checks)
 */
function generateMockToken(): string {
  // Expiration: 24 hours from now (in seconds)
  const exp = Math.floor(Date.now() / 1000) + 86400;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: 'test-user-id',
    email: 'test@playwright.com',
    exp,
  };

  // Base64url encode (note: real JWTs use base64url, we'll use btoa for simplicity)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const mockSignature = 'mock-signature-for-testing';

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

/**
 * Mock authentication for E2E tests
 * Sets a fake token in localStorage so the app thinks user is authenticated
 */
export async function mockAuthentication(page: Page) {
  await page.goto('/');

  const mockToken = generateMockToken();

  // Set auth token and user in localStorage (keys from authApi.ts)
  await page.evaluate(token => {
    localStorage.setItem('rpg-auth-token', token);
    localStorage.setItem(
      'rpg-user-data',
      JSON.stringify({
        id: 'test-user-id',
        email: 'test@playwright.com',
        name: 'Test User',
      }),
    );
  }, mockToken);
}

/**
 * Setup a test combat scenario
 * Initializes combat state in the store/backend
 */
export async function setupTestCombat(page: Page) {
  // Mock combat state in Pinia store via localStorage or sessionStorage
  // The combat store should persist its state or we inject it via window

  await page.evaluate(() => {
    // Mock combat state that the app will load
    const mockCombatState = {
      inCombat: true,
      player: {
        id: 'player',
        name: 'Test Hero',
        hp: 100,
        hpMax: 100,
        ac: 15,
        attackBonus: 5,
      },
      enemies: [
        {
          id: 'enemy-1',
          name: 'Goblin',
          hp: 30,
          hpMax: 30,
          ac: 12,
          attackBonus: 2,
        },
        {
          id: 'enemy-2',
          name: 'Orc',
          hp: 50,
          hpMax: 50,
          ac: 13,
          attackBonus: 4,
        },
      ],
      turnOrder: ['player', 'enemy-1', 'enemy-2'],
      currentTurnIndex: 0,
      roundNumber: 1,
      phase: 'player-turn',
      actionRemaining: 1,
      actionMax: 1,
    };

    // Store in sessionStorage with Pinia key (adjust based on actual key)
    sessionStorage.setItem('combat-store', JSON.stringify(mockCombatState));
  });

  // Navigate to combat page with a test character
  await page.goto('/game/test-character/combat');

  // Wait for the combat panel to be visible
  await page.waitForSelector('[data-cy="combat-panel"]', { timeout: 10000 });
}
