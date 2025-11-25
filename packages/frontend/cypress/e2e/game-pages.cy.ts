describe('Game detail pages', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.ensureAuth();
    // create a character
    cy.prepareE2EDb({ count: 1 }).then((r: any) => {
      expect(r?.ok).to.equal(true);
    });
  });

  it('should navigate to inventory page from sidebar', () => {
    cy.visit('/home');
    // Wait for characters to load and resume the first one
    cy.intercept('GET', '**/api/characters').as('getCharacters');
    cy.wait('@getCharacters');
    // Click the first resume button
    cy.get('button').contains('Reprendre').first().click();

    // We should be in the game route now
    cy.url().should('match', /\/game\/[A-Za-z0-9-]+$/);

    // Click Inventory in the sidebar
    cy.contains('Inventaire').click();

    // Inventory page should be visible
    cy.contains('Inventaire').should('exist');
    // Either shows 'Aucun objet pour le moment.' or a list
    cy.get('body').then(($body) => {
      const text = $body.text();
      expect(text.includes('Aucun objet pour le moment.') || text.includes('item(s)')).to.be.true;
    });
  });

  it('should navigate to spells page and show placeholder', () => {
    cy.visit('/home');
    cy.intercept('GET', '**/api/characters').as('getCharacters');
    cy.wait('@getCharacters');
    cy.get('button').contains('Reprendre').first().click();

    // Click Spells in the sidebar
    cy.contains('Sorts').click();

    cy.contains('Sorts').should('exist');
    // For now the spells view may show 'Aucun sort appris.' if none exist
    cy.contains('Aucun sort appris.').should('exist');
  });
});
