describe('Game detail pages', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.ensureAuth();
    // create a character
    cy.prepareE2EDb({ count: 1 })
      .then((r: any) => {
        expect(r?.ok).to.equal(true);
      });
  });

  it('should navigate to inventory page from sidebar', () => {
    // Intercept before navigation so we can catch the initial request
    cy.intercept('GET', '**/api/characters')
      .as('getCharacters');
    cy.visit('/home');
    // Wait for characters to load and resume the first one
    cy.wait('@getCharacters');
    // Click on the character card (role="button" with aria-label containing "Reprendre")
    cy.get('[role="button"][aria-label*="Reprendre"]')
      .first()
      .click();

    // Some test accounts may be in draft state and resume leads to character-step. Ensure we are on the game view
    cy.url()
      .then((u) => {
        const url = u.toString();
        const m = url.match(/\/character\/([^/]+)\/step\//);
        if (m) {
          const [_, id] = m;
          // ensure we fetch the character when visiting the game route
          cy.intercept('GET', `**/api/characters/${id}`)
            .as('getCharacter');
          cy.visit(`/game/${id}`);
          cy.wait('@getCharacter');
        }
      });

    // We should be in the game route now
    cy.url()
      .should('match', /\/game\/[A-Za-z0-9-]+$/);

    // Click Inventory in the sidebar
    cy.contains('Inventaire')
      .click();

    // Inventory page should be visible
    cy.contains('Inventaire')
      .should('exist');
    // Either shows 'Aucun objet pour le moment.' or a list
    cy.get('body')
      .then(($body) => {
        const text = $body.text();
        expect(text.includes('Aucun objet pour le moment.') || text.includes('item(s)')).to.be.true;
      });
  });

  it('should navigate to spells page and show placeholder', () => {
    // Intercept before page load
    cy.intercept('GET', '**/api/characters')
      .as('getCharacters');
    cy.visit('/home');
    cy.wait('@getCharacters');
    // Click on the character card (role="button" with aria-label containing "Reprendre")
    cy.get('[role="button"][aria-label*="Reprendre"]')
      .first()
      .click();
    // ensure we are on the game view (if resume navigates to character-step, visit game explicitely)
    cy.url()
      .then((u) => {
        const url = u.toString();
        const m = url.match(/\/character\/([^/]+)\/step\//);
        if (m) {
          const [_, id] = m;
          cy.intercept('GET', `**/api/characters/${id}`)
            .as('getCharacter');
          cy.visit(`/game/${id}`);
          cy.wait('@getCharacter');
        }
      });

    // Click Spells in the sidebar — ensure element is not covered and scroll into view
    cy.contains('Sorts')
      .scrollIntoView()
      .click({ force: true });

    cy.contains('Sorts')
      .should('exist');
    // For now the spells view may show 'Aucun sort appris.' if none exist
    cy.contains('Aucun sort appris.')
      .should('exist');
  });
});
