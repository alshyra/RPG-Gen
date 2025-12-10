import { test, expect } from '@playwright/test';
import { mockAuthentication, clearAuthentication } from '../helpers/auth';

/**
 * Authentication Flow Tests
 * Tests authentication, routing protection, and login/logout flows
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthentication(page);
  });

  test('should display landing page when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should see landing page
    expect(page.url()).not.toContain('/login');
    await expect(page.getByText('RPG Gemini')).toBeVisible();
    await expect(page.getByText("Vivez des aventures épiques générées par l'IA")).toBeVisible();
    await expect(page.getByText('Commencer à jouer')).toBeVisible();
  });

  test('should redirect to login when clicking start playing', async ({ page }) => {
    await page.goto('/');

    // Click on start playing button
    await page.getByRole('button', { name: 'Commencer à jouer' }).click();

    // Should be redirected to login page
    await page.waitForURL('**/login');
    await expect(page.getByText('Connectez-vous pour commencer votre aventure')).toBeVisible();
  });

  test('should display Google login button on login page', async ({ page }) => {
    await page.goto('/login');

    // Check for login page elements
    await expect(page.getByText('RPG Gemini')).toBeVisible();
    await expect(page.getByText('Se connecter avec Google')).toBeVisible();

    // Check for Google OAuth button
    await expect(page.getByRole('button', { name: /Se connecter avec Google/i })).toBeVisible();
  });

  test('should protect home route (world selector)', async ({ page }) => {
    // Try to access home without being authenticated
    await page.goto('/home');

    // Should redirect to login page
    await page.waitForURL('**/login');

    // World selector should not be visible
    await expect(page.getByText('Choisis ton univers')).not.toBeVisible();
  });

  test('should protect character creation route', async ({ page }) => {
    // Try to access character creation without authentication
    await page.goto('/character/dnd/step/1');

    // Should redirect to login
    await page.waitForURL('**/login');
  });

  test('should protect game route', async ({ page }) => {
    // Try to access game without authentication
    await page.goto('/game/test-id');

    // Should redirect to login
    await page.waitForURL('**/login');
  });

  test.describe('With mocked authentication', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthentication(page);
    });

    test('should access home page (world selector) when authenticated', async ({ page }) => {
      await page.goto('/home');

      // Should not redirect to login
      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/home');

      // Should see home page content
      await expect(page.getByText('RPG Gemini')).toBeVisible();
    });

    test('should redirect authenticated users from login to home', async ({ page }) => {
      await page.goto('/login');

      // Should redirect to home
      await page.waitForURL('**/home');
      expect(page.url()).not.toContain('/login');
    });

    test('should display user profile when authenticated', async ({ page }) => {
      await page.goto('/home');

      // User profile should be visible
      await expect(page.getByText('E2E Test User')).toBeVisible();
      await expect(page.getByText('e2e@playwright.test')).toBeVisible();
    });
  });
});
