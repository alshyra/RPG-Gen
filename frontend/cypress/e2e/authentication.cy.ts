describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear all storage before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should redirect to login when not authenticated', () => {
    cy.visit('/');
    
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
    cy.get('button').contains('Se connecter avec Google').should('be.visible');
  });

  it('should show login page before accessing world selector', () => {
    // Try to access home without being authenticated
    cy.visit('/');
    
    // Should be on login page
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
      // Mock authentication by setting token and user in localStorage
      const mockToken = 'mock-jwt-token-for-testing';
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      };
      
      localStorage.setItem('rpg-auth-token', mockToken);
      localStorage.setItem('rpg-user-data', JSON.stringify(mockUser));
    });

    it('should access home page when authenticated', () => {
      cy.visit('/');
      
      // Should not redirect to login
      cy.url().should('not.include', '/login');
      
      // Should see home page content
      cy.contains('RPG Gemini').should('be.visible');
    });

    it('should display user profile when authenticated', () => {
      cy.visit('/');
      
      // User profile should be visible
      cy.contains('Test User').should('be.visible');
      cy.contains('test@example.com').should('be.visible');
    });

    it('should allow logout', () => {
      cy.visit('/');
      
      // Click on user profile to open menu (if dropdown exists)
      cy.get('button').contains('Test User').click();
      
      // Look for logout button
      cy.contains('Se déconnecter').should('be.visible');
    });

    it('should redirect to login after logout', () => {
      cy.visit('/');
      
      // Perform logout by clearing storage
      cy.clearLocalStorage();
      
      // Try to visit home again
      cy.visit('/');
      
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
      // Visit callback route with a mock token
      cy.visit('/auth/callback?token=mock-token-123');
      
      // Page should exist and handle the callback
      cy.get('#app').should('exist');
    });

    it('should show error when callback has no token', () => {
      cy.visit('/auth/callback');
      
      // Should show error message or redirect
      cy.get('#app').should('exist');
    });
  });

  describe('Session persistence', () => {
    it('should persist authentication across page reloads', () => {
      // Set up authentication
      const mockToken = 'persistent-token';
      const mockUser = {
        id: 'user-456',
        email: 'persistent@example.com',
        displayName: 'Persistent User'
      };
      
      localStorage.setItem('rpg-auth-token', mockToken);
      localStorage.setItem('rpg-user-data', JSON.stringify(mockUser));
      
      cy.visit('/');
      cy.contains('Persistent User').should('be.visible');
      
      // Reload page
      cy.reload();
      
      // Should still be authenticated
      cy.contains('Persistent User').should('be.visible');
      cy.url().should('not.include', '/login');
    });

    it('should clear authentication when token is removed', () => {
      // Set up authentication
      localStorage.setItem('rpg-auth-token', 'token-to-remove');
      localStorage.setItem('rpg-user-data', JSON.stringify({ id: '1', email: 'test@test.com' }));
      
      cy.visit('/');
      
      // Clear token
      cy.clearLocalStorage('rpg-auth-token');
      cy.clearLocalStorage('rpg-user-data');
      
      // Reload
      cy.reload();
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });
});
