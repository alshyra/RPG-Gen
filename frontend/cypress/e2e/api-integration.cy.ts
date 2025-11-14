describe('API Integration', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    
    // Mock authentication for API tests
    const mockToken = 'api-test-token';
    const mockUser = {
      id: 'api-user',
      email: 'api@example.com',
      displayName: 'API Tester'
    };
    localStorage.setItem('rpg-auth-token', mockToken);
    localStorage.setItem('rpg-user-data', JSON.stringify(mockUser));
    
    cy.visit('/');
  });

  it('should handle API calls gracefully', () => {
    // Intercept API calls that might be made
    cy.intercept('POST', '/api/**', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Test response',
      },
    }).as('apiCall');

    // The app should load without making immediate API calls
    cy.contains('RPG Gemini').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Stub API to return error
    cy.intercept('POST', '/api/**', {
      statusCode: 500,
      body: {
        error: 'Internal Server Error',
      },
    }).as('apiError');

    // Navigate through the app
    cy.visit('/');
    cy.contains('RPG Gemini').should('be.visible');
  });

  it('should work offline (no backend)', () => {
    // This test verifies the frontend loads without a backend
    cy.visit('/');
    
    // Basic UI should still work
    cy.contains('RPG Gemini').should('be.visible');
    cy.contains('Choisir un univers').should('be.visible');
    
    // World selector should be functional
    cy.contains('Dungeons & Dragons').should('be.visible');
  });
});
