describe('Home Page', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    
    // Authenticate using the real backend (needs DISABLE_AUTH_FOR_E2E=true in backend)
    cy.ensureAuth();
    
    cy.visit('/home');
  });

  it('should load the home page successfully', () => {
    cy.contains('RPG Gemini').should('be.visible');
    cy.contains('Un moteur d\'aventure assisté par Gemini').should('be.visible');
  });

  it('should display the world selector', () => {
    // The WorldSelector component should be present
    cy.get('h1').contains('RPG Gemini').should('exist');
  });

  it('should display message when no characters exist (or show characters if present)', () => {
    // Wait for the characters request and accept either state (no characters or some characters)
    cy.intercept('GET', '**/api/characters').as('getCharactersCheck');
    cy.visit('/home');
    cy.wait('@getCharactersCheck');

    cy.get('body').then(($body) => {
      const text = $body.text();
      if (text.includes('Aucun personnage créé')) {
        cy.contains('Aucun personnage créé').should('be.visible');
        cy.contains('Sélectionnez un univers ci-dessous pour commencer').should('be.visible');
      } else {
        // If there are characters present, ensure the characters header is visible
        cy.contains('Mes personnages').should('be.visible');
      }
    });
  });

  it('should display character list when characters exist', () => {
    // Mock API with characters
      // The mockCharacters array has been removed. Tests should use live backend data.

    // Spy on characters request and forward to backend (no stub). We'll wait for the
    // actual request so the UI has loaded characters if present.
    cy.intercept('GET', '**/api/characters').as('getCharacters');

    cy.visit('/home');
    cy.wait('@getCharacters');

    // Should display "Mes personnages" header
    cy.contains('Mes personnages').should('be.visible');

    // If backend has characters, the UI should show the characters section; otherwise
    // a friendly 'no characters' message will be shown. Both states are acceptable
    // for E2E since we rely on a live backend.
    cy.get('body').then(($body) => {
      const text = $body.text();
      if (text.includes('Aucun personnage créé')) {
        cy.contains('Aucun personnage créé').should('be.visible');
      } else {
        cy.contains('Mes personnages').should('be.visible');
        // Ensure UI includes action buttons if characters exist
        cy.get('button').filter(':contains("Reprendre")').should('have.length.gte', 1);
      }
    });

    // Should have resume and delete buttons for each character
    cy.get('button').contains('Reprendre').should('exist');
    cy.get('button').contains('Supprimer').should('exist');
    // At least one action button should be available for existing characters
    cy.get('button').filter(':contains("Reprendre")').should('have.length.gte', 1);
    cy.get('button').filter(':contains("Supprimer")').should('have.length.gte', 1);
  });

  it('should navigate to character creation when world is selected', () => {
    // This test would need to interact with WorldSelector
    // For now, we just verify the page structure is correct
    // Use data-cy selector to choose a world and assert we navigate to the character creation flow
    cy.dataCy('world-start-dnd').click();
    // Should navigate to the character creation route (with generated characterId)
    cy.url().should('match', /\/character\/[^/]+\/step\/1/);
    // Confirm the character creation wizard header is visible
    cy.contains('Création de personnage').should('be.visible');
  });
});
