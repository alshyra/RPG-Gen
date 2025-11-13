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
    cy.url().should('match', new RegExp(`${Cypress.config().baseUrl}/?$`));
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
    // Visit an unknown route - Vue router handles this client-side
    cy.visit('/unknown-route', { failOnStatusCode: false });
    // The app should still load
    cy.get('#app').should('exist');
  });
});
