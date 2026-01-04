import { Page } from "@playwright/test";

/**
 * Backend API helper for E2E test data management
 * Equivalent to Cypress tasks for prepareE2EDb and cleanupE2EDb
 */

const API_BASE = process.env.E2E_API_URL || "http://localhost:3001";

export interface PrepareDbOptions {
  count?: number;
  ready?: boolean;
  withChat?: boolean;
}

/**
 * Prepare E2E database with test characters
 * Directly calls backend endpoints like the prepare-e2e-db script
 */
export async function prepareE2EDb(options: PrepareDbOptions = {}): Promise<{ ok: boolean }> {
  const { count = 2, ready = false, withChat = false } = options;

  try {
    const created = [];
    for (let i = 1; i <= count; i++) {
      // Create character
      const createRes = await fetch(`${API_BASE}/api/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ world: "dnd" }),
      });

      if (!createRes.ok) {
        console.error(`Failed to create character ${i}:`, createRes.status);
        continue;
      }

      const createData = await createRes.json();
      const characterId = createData?.characterId || createData?.id;
      if (!characterId) {
        console.error("Created response missing characterId:", createData);
        continue;
      }

      // Update character with name and optional ready state
      const name = `e2e-${new Date().toISOString().replace(/[:.]/g, "")}-${i}`;
      const updateBody = { name } as Record<string, unknown>;

      if (ready) {
        Object.assign(updateBody, {
          hp: 12,
          hpMax: 12,
          proficiency: 2,
          stats: { vigor: 1, finesse: 1, mind: 1, survival: 1 },
          portrait: "/images/portraits/default.png",
          world: "dnd",
          state: "created",
        });
      }

      await fetch(`${API_BASE}/api/characters/${characterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      created.push(characterId);

      // Add starter weapon if ready
      if (ready) {
        try {
          await fetch(`${API_BASE}/api/characters/${characterId}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              definitionId: "weapon-rapier",
              name: "Rapier",
              qty: 1,
              equipped: true,
              meta: { type: "weapon" },
            }),
          });

          await fetch(`${API_BASE}/api/characters/${characterId}/inventory/equip`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ definitionId: "weapon-rapier" }),
          });
        } catch (e) {
          console.error(`Failed to add weapon for character ${characterId}:`, e);
        }
      }

      // Start combat if withChat
      if (withChat) {
        try {
          await fetch(`${API_BASE}/api/combat/${characterId}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              combat_start: [
                {
                  name: "Goblin",
                  hp: 7,
                  attack_bonus: 4,
                  damage_dice: "1d6",
                  damage_bonus: 2,
                },
              ],
            }),
          });
        } catch (e) {
          console.error(`Failed to start combat for character ${characterId}:`, e);
        }
      }
    }

    console.log(`[prepareE2EDb] Created ${created.length}/${count} characters`);
    return { ok: created.length > 0 };
  } catch (error) {
    console.error("Failed to prepare E2E DB:", error);
    return { ok: false };
  }
}

/**
 * Cleanup E2E database test data
 * Deletes all characters by fetching list and deleting each one
 */
export async function cleanupE2EDb(): Promise<{ ok: boolean }> {
  try {
    // Fetch all characters
    const listRes = await fetch(`${API_BASE}/api/characters`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!listRes.ok) {
      console.error("Failed to list characters:", listRes.status);
      return { ok: false };
    }

    const characters = await listRes.json();
    console.log(`[cleanupE2EDb] Found ${characters.length} characters to delete`);

    // Delete each character
    for (const char of characters) {
      try {
        await fetch(`${API_BASE}/api/characters/${char.characterId}`, {
          method: "DELETE",
        });
      } catch (e) {
        console.error(`Failed to delete character ${char.characterId}:`, e);
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("Failed to cleanup E2E DB:", error);
    return { ok: false };
  }
}

/**
 * Setup API mocks/intercepts for a page
 * Replace cy.intercept with page.route
 */
export async function setupApiIntercepts(page: Page) {
  // Mock auth profile endpoint
  await page.route("**/api/auth/profile", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        name: "E2E Test User",
        displayName: "E2E Test User",
        email: "e2e@playwright.test",
        picture: "http://localhost/avatar.png",
      }),
    })
  );
}
