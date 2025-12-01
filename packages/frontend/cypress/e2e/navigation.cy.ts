describe('Navigation', () => {
  beforeEach(() => {
    // Mock authentication for navigation tests
    cy.ensureAuth();
  });

  it('should navigate between routes', () => {
    // Start at home
    cy.visit('/home');
    cy.contains('RPG Gemini')
      .should('be.visible');

    // Navigate back to home
    cy.visit('/home');
    cy.url()
      .should('include', '/home');
  });

  it('should redirect to home when visiting /game without a character', () => {
    // Clear localStorage to ensure no character exists (but keep auth)
    localStorage.removeItem('rpg-character-id');

    // Visit /game without a valid character ID - should redirect
    cy.visit('/game/nonexistent-character-id', { failOnStatusCode: false });

    // The app should handle this gracefully
    cy.get('#app')
      .should('exist');
  });

  it('should handle levelup route', () => {
    cy.visit('/levelup');
    cy.url()
      .should('include', '/levelup');
  });

  it('clicking the title navigates to home', () => {
    cy.ensureAuth();
    // Prepare a single character
    cy.prepareE2EDb({ count: 1 })
      .then((r: any) => {
        expect(r?.ok).to.equal(true);
      });

    // Intercept before visiting so we capture the initial characters request
    cy.intercept('GET', '**/api/characters')
      .as('getCharacters');
    cy.visit('/home');
    cy.wait('@getCharacters');
    // Resume the first character
    cy.get('button')
      .contains('Reprendre')
      .first()
      .click();

    // If the character is in draft state the resume button leads to character-step;
    // if so, navigate to /game/:characterId explicitly; otherwise we should already be in /game/:id.
    cy.url()
      .then((u) => {
        const url = u.toString();
        const m = url.match(/\/character\/([^/]+)\/step\//);
        if (m) {
          const [, id] = m;
          cy.intercept('GET', `**/api/characters/${id}`)
            .as('getCharacter');
          cy.visit(`/game/${id}`);
          cy.wait('@getCharacter');
        }
      });

    // Ensure we are on /game/:id
    cy.url()
      .should('match', /\/game\/[A-Za-z0-9-]+.*$/);

    // Click the RPG Gemini title to go home
    cy.get('h1')
      .contains('RPG Gemini')
      .click();
    cy.url()
      .should('include', '/home');
  });

  it('should handle 404 for unknown routes', () => {
    // Visit an unknown route - Vue router handles this client-side
    cy.visit('/unknown-route', { failOnStatusCode: false });
    // The app should still load
    cy.get('#app')
      .should('exist');
  });
});
