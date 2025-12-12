import { test, expect } from '@playwright/test';

test.describe('Combat Victory Flow', () => {
  let token: string;
  let userId: string;
  let characterId: string;

  test.beforeEach(async ({ request }) => {
    // Create user and character
    const auth = await createAuthenticatedUser(request);
    token = auth.token;
    userId = auth.userId;

    const character = await createCharacterViaAPI(request, token, {
      name: 'Victory Tester',
      world: 'dnd',
      race: 'Human',
      classes: [{ name: 'Fighter', level: 5 }],
      hp: 50,
      hpMax: 50,
    });
    characterId = character.characterId;
  });

  test.afterEach(async ({ request }) => {
    if (characterId) await cleanupCharacter(request, token, characterId);
    if (userId) await cleanupUser(request, token, userId);
  });

  test('should display victory modal when all enemies are defeated', async ({ page, request }) => {
    // Start combat with 1 weak enemy (1 HP)
    const startResponse = await request.post(`/api/combat/${characterId}/start`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        enemies: [
          {
            id: 'weak-goblin-1',
            name: 'Weak Goblin',
            hp: 1,
            hpMax: 1,
            ac: 5,
            attackBonus: 0,
            damageDice: '1d4',
            damageBonus: 0,
          },
        ],
      },
    });

    expect(startResponse.ok()).toBeTruthy();

    // Navigate to game page
    await page.goto(`http://localhost:5173/game/${characterId}`);
    await page.waitForLoadState('networkidle');

    // Verify combat started
    await expect(page.locator('[data-cy="combat-panel"]')).toBeVisible();

    // Attack the enemy (should kill it in one hit)
    const enemyPortrait = page.locator('[data-cy="enemy-0"]');
    await enemyPortrait.locator('[data-cy="attack-button"]').click();

    // Select "Attaque" (basic attack) from spell selector
    await page.locator('button:has-text("Attaquer")').first().click();

    // Wait for attack animation
    await page.waitForTimeout(1000);

    // End turn to trigger combat end check
    await page.locator('button:has-text("Terminer le tour")').click();

    // Wait for enemy turn processing
    await page.waitForTimeout(2000);

    // Verify victory modal appears
    await expect(page.locator('text=🏆 Victoire!')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Victoire|gagné|vaincu/i')).toBeVisible();

    // Click "Continuer" to close modal
    await page.locator('button:has-text("Continuer")').click();

    // Verify navigation back to messages view
    await expect(page.locator('[data-cy="chat-messages"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-cy="combat-panel"]')).not.toBeVisible();
  });

  test('should not display victory modal if enemies remain', async ({ page, request }) => {
    // Start combat with 2 enemies
    const startResponse = await request.post(`/api/combat/${characterId}/start`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        enemies: [
          {
            id: 'goblin-1',
            name: 'Goblin 1',
            hp: 7,
            hpMax: 7,
            ac: 12,
            attackBonus: 2,
            damageDice: '1d6',
            damageBonus: 1,
          },
          {
            id: 'goblin-2',
            name: 'Goblin 2',
            hp: 7,
            hpMax: 7,
            ac: 12,
            attackBonus: 2,
            damageDice: '1d6',
            damageBonus: 1,
          },
        ],
      },
    });

    expect(startResponse.ok()).toBeTruthy();

    // Navigate to game page
    await page.goto(`http://localhost:5173/game/${characterId}`);
    await page.waitForLoadState('networkidle');

    // Attack first enemy (might not kill it)
    const enemyPortrait = page.locator('[data-cy="enemy-0"]');
    await enemyPortrait.locator('[data-cy="attack-button"]').click();
    await page.locator('button:has-text("Attaquer")').first().click();

    await page.waitForTimeout(1000);

    // End turn
    await page.locator('button:has-text("Terminer le tour")').click();
    await page.waitForTimeout(2000);

    // Verify victory modal does NOT appear
    await expect(page.locator('text=🏆 Victoire!')).not.toBeVisible();

    // Verify still in combat
    await expect(page.locator('[data-cy="combat-panel"]')).toBeVisible();
  });
});
