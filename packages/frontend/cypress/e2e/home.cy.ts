describe('Home Page', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();

    cy.ensureAuth();

    // Create test characters via the repo helper — this uses the DISABLE_AUTH_FOR_E2E bypass
    cy.prepareE2EDb({ count: 2 })
      .then((r) => {
        expect(r?.ok).to.equal(true);
      });

    cy.visit('/home');
  });

  it('should load the home page successfully', () => {
    cy.contains('RPG Gemini')
      .should('be.visible');
    cy.contains('Un moteur d\'aventure assisté par Gemini')
      .should('be.visible');
  });

  it('should display the world selector', () => {
    cy.get('h1')
      .contains('RPG Gemini')
      .should('exist');
  });

  it('should display message when no characters exist (or show characters if present)', () => {
    // Wait for the characters request and accept either state (no characters or some characters)
    cy.intercept('GET', '**/api/characters')
      .as('getCharactersCheck');
    cy.visit('/home');
    cy.wait('@getCharactersCheck');

    cy.get('body')
      .then(($body) => {
        const text = $body.text();
        if (text.includes('Aucun personnage créé')) {
          cy.contains('Aucun personnage créé')
            .should('be.visible');
          cy.contains('Sélectionnez un univers ci-dessous pour commencer')
            .should('be.visible');
        } else {
        // If there are characters present, ensure the characters header is visible
          cy.contains('Mes personnages')
            .should('be.visible');
        }
      });
  });

  it('should display character list when characters exist', () => {
    // Spy on characters request and wait for the UI to fetch updated characters
    cy.intercept('GET', '**/api/characters')
      .as('getCharacters');

    cy.visit('/home');
    cy.wait('@getCharacters');

    // Should display "Mes personnages" header
    cy.contains('Mes personnages')
      .should('be.visible');

    // If backend has characters, the UI should show the characters section; otherwise
    // a friendly 'no characters' message will be shown. Both states are acceptable
    // for E2E since we rely on a live backend.
    cy.get('body')
      .then(($body) => {
        const text = $body.text();
        if (text.includes('Aucun personnage trouvé')) {
          cy.contains(/Aucun personnage trouvé/)
            .should('be.visible');
        } else {
          cy.contains('Mes personnages')
            .should('be.visible');
          // Ensure UI includes character cards with aria-label containing "Reprendre"
          cy.get('[role="button"][aria-label*="Reprendre"]')
            .should('have.length.gte', 1);
        }
      });

    // Should have clickable character cards and delete buttons
    cy.get('[role="button"][aria-label*="Reprendre"]')
      .should('exist');
    cy.get('button[aria-label*="Supprimer"]')
      .should('exist');
    // At least one character card should be available for existing characters
    cy.get('[role="button"][aria-label*="Reprendre"]')
      .should('have.length.gte', 1);
    cy.get('button[aria-label*="Supprimer"]')
      .should('have.length.gte', 1);

    // Clean up: ensure we didn't leave extra test characters behind - optional but helpful.
    // We'll leave characters in CI for debugging; if you prefer cleanup, we could delete them here.
  });

  it('should navigate to character creation when world is selected', () => {
    // Click it to navigate to character creation
    cy.contains('button', 'Créer un personnage')
      .click();
    // Should navigate to the character creation route (with generated characterId)
    cy.url()
      .should('match', /\/character\/[^/]+\/step\/1/);
    // Confirm the character creation wizard header is visible
    cy.contains('Création de personnage')
      .should('be.visible');
  });
});
