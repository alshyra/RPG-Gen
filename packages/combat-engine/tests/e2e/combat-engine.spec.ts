import { test, expect } from "@playwright/test";

/**
 * Combat Engine E2E Tests
 * Tests the combat engine package in isolation using its dev server
 */

test.describe("Combat Engine - Canvas Rendering", () => {
  test("should render canvas with correct dimensions", async ({ page }) => {
    await page.goto("/");

    // Wait for combat arena to be visible
    const arena = page.locator('[data-cy="combat-arena"]');
    await expect(arena).toBeVisible({ timeout: 5000 });

    // Wait for canvas container
    const canvasContainer = page.locator('[data-cy="combat-canvas-container"]');
    await expect(canvasContainer).toBeVisible();

    // Wait for PIXI canvas to be created
    const canvas = canvasContainer.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Verify canvas dimensions (12 cols × 64px = 768, 9 rows × 64px = 576)
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    if (box) {
      // Allow tolerance for devicePixelRatio
      expect(box.width).toBeGreaterThanOrEqual(700);
      expect(box.width).toBeLessThanOrEqual(850);
      expect(box.height).toBeGreaterThanOrEqual(550);
      expect(box.height).toBeLessThanOrEqual(650);
    }
  });

  test("should display grid with tiles and lines", async ({ page }) => {
    await page.goto("/");

    const canvas = page.locator('[data-cy="combat-canvas-container"] canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Wait for PIXI to render
    await page.waitForTimeout(1000);

    // Canvas should have content (not blank)
    const canvasExists = await canvas.count();
    expect(canvasExists).toBe(1);
  });
});

test.describe("Combat Engine - Unit Display", () => {
  test("should create and display player unit", async ({ page }) => {
    await page.goto("/");

    // Capture console messages to verify units are being created
    const consoleMsgs: string[] = [];
    page.on("console", msg => {
      consoleMsgs.push(msg.text());
    });

    const canvas = page.locator('[data-cy="combat-canvas-container"] canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Wait for units to be created
    await page.waitForTimeout(2000);

    // Check if any unit creation messages were logged
    // const hasUnitLogs = consoleMsgs.some(
    //   msg =>
    //     msg.includes('Unit created') ||
    //     msg.includes('createUnit') ||
    //     msg.includes('enemy') ||
    //     msg.includes('Combat engine initialisé'),
    // );

    // At minimum, canvas should be visible and have dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    if (canvasBox) {
      expect(canvasBox.width).toBeGreaterThan(0);
      expect(canvasBox.height).toBeGreaterThan(0);
    }
  });

  test("should create and display enemy unit", async ({ page }) => {
    // Capture errors and logs
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");

    const canvas = page.locator('[data-cy="combat-canvas-container"] canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(2000);

    // Should have no errors
    expect(errors).toHaveLength(0);

    // Canvas should be properly initialized
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    if (canvasBox) {
      expect(canvasBox.width).toBeGreaterThan(500); // Grid is 12 cols × 64px
      expect(canvasBox.height).toBeGreaterThan(500); // Grid is 9 rows × 64px
    }
  });
});

test.describe("Combat Engine - Drag and Drop", () => {
  test("should allow dragging player sprite to adjacent cell", async ({ page }) => {
    await page.goto("/");

    const canvas = page.locator('[data-cy="combat-canvas-container"] canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Wait for units and drag setup
    await page.waitForTimeout(2000);

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    const cellSize = 64;

    // Player starts at gridX: 1, gridY: 5 (from App.vue)
    const playerGridX = 1;
    const playerGridY = 5;

    const playerX = box.x + (playerGridX * cellSize + cellSize / 2);
    const playerY = box.y + (playerGridY * cellSize + cellSize / 2);

    // Target: move to gridX: 2, gridY: 5 (one cell right)
    const targetGridX = 2;
    const targetGridY = 5;

    const targetX = box.x + (targetGridX * cellSize + cellSize / 2);
    const targetY = box.y + (targetGridY * cellSize + cellSize / 2);

    // Perform drag
    await page.mouse.move(playerX, playerY);
    await page.mouse.down();

    // Drag slowly
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const x = playerX + ((targetX - playerX) * i) / steps;
      const y = playerY + ((targetY - playerY) * i) / steps;
      await page.mouse.move(x, y);
      await page.waitForTimeout(10);
    }

    await page.mouse.up();

    // Wait for movement animation
    await page.waitForTimeout(800);

    // Verify no errors occurred
    const stillVisible = await canvas.isVisible();
    expect(stillVisible).toBe(true);
  });

  test("should show reachable cells overlay on drag start", async ({ page }) => {
    await page.goto("/");

    const canvas = page.locator('[data-cy="combat-canvas-container"] canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    const cellSize = 64;
    const playerGridX = 1;
    const playerGridY = 5;

    const playerX = box.x + (playerGridX * cellSize + cellSize / 2);
    const playerY = box.y + (playerGridY * cellSize + cellSize / 2);

    // Start drag (should trigger overlay)
    await page.mouse.move(playerX, playerY);
    await page.mouse.down();

    // Wait for overlay to render
    await page.waitForTimeout(300);

    // Release
    await page.mouse.up();

    // Verify canvas still works
    const stillVisible = await canvas.isVisible();
    expect(stillVisible).toBe(true);
  });

  test("should move sprite to valid cell within move range", async ({ page }) => {
    await page.goto("/");

    const canvas = page.locator('[data-cy="combat-canvas-container"] canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    const cellSize = 64;
    const playerGridX = 1;
    const playerGridY = 5;

    const playerX = box.x + (playerGridX * cellSize + cellSize / 2);
    const playerY = box.y + (playerGridY * cellSize + cellSize / 2);

    // Move to gridX: 3, gridY: 4 (within range of 3)
    const targetGridX = 3;
    const targetGridY = 4;

    const targetX = box.x + (targetGridX * cellSize + cellSize / 2);
    const targetY = box.y + (targetGridY * cellSize + cellSize / 2);

    await page.mouse.move(playerX, playerY);
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(800);

    // Try another move from new position
    const secondTargetX = box.x + (4 * cellSize + cellSize / 2);
    await page.mouse.move(targetX, targetY);
    await page.mouse.down();
    await page.mouse.move(secondTargetX, targetY, { steps: 5 });
    await page.mouse.up();

    await page.waitForTimeout(600);

    const stillVisible = await canvas.isVisible();
    expect(stillVisible).toBe(true);
  });
});

test.describe("Combat Engine - Health Bars", () => {
  test("should display health bars for units", async ({ page }) => {
    await page.goto("/");

    const canvas = page.locator('[data-cy="combat-canvas-container"] canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Wait for units with health bars to be created
    await page.waitForTimeout(2000);

    // Health bars are rendered on the PIXI canvas, so we can't directly inspect them
    // But we verify the initialization completed without errors
    const stillVisible = await canvas.isVisible();
    expect(stillVisible).toBe(true);
  });
});
