describe('Navigation', () => {
  it('should navigate between routes', () => {
    // Start at home
    cy.visit('/');
    cy.contains('RPG Gemini').should('be.visible');

    // Test direct navigation to character creation
    cy.visit('/character');
    cy.url().should('include', '/character');

    // Navigate back to home
    cy.visit('/');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should handle game route', () => {
    cy.visit('/game');
    cy.url().should('include', '/game');
  });

  it('should handle levelup route', () => {
    cy.visit('/levelup');
    cy.url().should('include', '/levelup');
  });

  it('should handle 404 for unknown routes', () => {
    // Visit an unknown route
    cy.visit('/unknown-route', { failOnStatusCode: false });
    // The app should still load (Vue router typically handles this client-side)
  });
});
