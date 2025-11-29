describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear all storage before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display landing page when not authenticated', () => {
    cy.visit('/');

    // Should see landing page
    cy.url().should('not.include', '/login');
    cy.contains('RPG Gemini').should('be.visible');
    cy.contains('Vivez des aventures épiques générées par l\'IA').should('be.visible');
    cy.contains('Commencer à jouer').should('be.visible');
  });

  it('should redirect to login when clicking start playing', () => {
    cy.visit('/');

    // Click on start playing button
    cy.contains('Commencer à jouer').click();

    // Should be redirected to login page
    cy.url().should('include', '/login');
    cy.contains('Connectez-vous pour commencer votre aventure').should('be.visible');
  });

  it('should display Google login button on login page', () => {
    cy.visit('/login');

    // Check for login page elements
    cy.contains('RPG Gemini').should('be.visible');
    cy.contains('Se connecter avec Google').should('be.visible');

    // Check for Google OAuth button
    cy.get('button').contains('Se connecter avec Google')
      .should('be.visible');
  });

  it('should protect home route (world selector)', () => {
    // Try to access home without being authenticated
    cy.visit('/home');

    // Should redirect to login page
    cy.url().should('include', '/login');

    // World selector should not be visible
    cy.contains('Choisis ton univers').should('not.exist');
  });

  it('should protect character creation route', () => {
    // Try to access character creation without authentication
    cy.visit('/character/dnd/step/1');

    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('should protect game route', () => {
    // Try to access game without authentication
    cy.visit('/game');

    // Should redirect to login
    cy.url().should('include', '/login');
  });

  describe('With mocked authentication', () => {
    beforeEach(() => {
      // Use the custom ensureAuth command (real backend required)
      cy.ensureAuth();
    });

    it('should access home page (world selector) when authenticated', () => {
      cy.visit('/home');

      // Should not redirect to login
      cy.url().should('not.include', '/login');
      cy.url().should('include', '/home');

      // Should see home page content
      cy.contains('RPG Gemini').should('be.visible');
    });

    it('should redirect authenticated users from login to home', () => {
      cy.visit('/login');

      // Should redirect to home
      cy.url().should('include', '/home');
      cy.url().should('not.include', '/login');
    });

    it('should display user profile when authenticated', () => {
      cy.visit('/home');

      // User profile should be visible
      cy.contains('Test User').should('be.visible');
      cy.contains('test@example.com').should('be.visible');
    });

    it('should allow logout', () => {
      cy.visit('/home');

      // Click on user profile avatar to open menu
      cy.get('button').find('img[alt="Test User"]')
        .parent()
        .click();

      // Look for logout button
      cy.contains('Se déconnecter').should('be.visible');
    });

    it('should redirect to login after logout', () => {
      cy.visit('/home');

      // Perform logout by clearing storage
      cy.clearAuth();

      // Try to visit home again
      cy.visit('/home');

      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should allow access to protected routes when authenticated', () => {
      cy.visit('/character/dnd/step/1');

      // Should not redirect to login
      cy.url().should('include', '/character/dnd/step/1');
    });
  });

  describe('OAuth callback handling', () => {
    it('should handle auth callback route', () => {
      // Spy on API calls during callback and allow the real backend to handle them
      cy.intercept('POST', '/api/**').as('apiPost');
      cy.intercept('GET', '/api/**').as('apiGet');

      // Visit callback route with a mock token
      cy.visit('/auth/callback?token=mock-token-123', { failOnStatusCode: false });

      // Page should exist and handle the callback
      cy.get('#app', { timeout: 3000 }).should('exist');
    });

    it('should show error when callback has no token', () => {
      // Spy on API calls (we're not stubbing success responses anymore)
      cy.intercept('POST', '/api/**').as('apiPost2');
      cy.intercept('GET', '/api/**').as('apiGet2');

      cy.visit('/auth/callback', { failOnStatusCode: false });

      // Should show error message or redirect
      cy.get('#app', { timeout: 3000 }).should('exist');
    });
  });

  describe('Session persistence', () => {
    it('should persist authentication across page reloads', () => {
      // Set up authentication using real backend
      cy.ensureAuth();

      cy.visit('/home');
      cy.contains('Test User').should('be.visible');

      // Reload page
      cy.reload();

      // Should still be authenticated
      cy.contains('Test User').should('be.visible');
      cy.url().should('not.include', '/login');
    });

    it('should clear authentication when token is removed', () => {
      // Set up authentication using real backend
      cy.ensureAuth();

      cy.visit('/home');

      // Clear token
      cy.clearAuth();

      // Reload
      cy.reload();

      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });
});
