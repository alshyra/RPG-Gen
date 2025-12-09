describe('Combat flow', () => {
  before(() => {
    // ensure backend & DB prepared; create one ready character with combat_start in history
    cy.clearLocalStorage();
    cy.ensureAuth();
    // Clean previous test data to ensure deterministic character selection
    cy.cleanupE2EDb()
      .then(() => {
        cy.prepareE2EDb({
          count: 1,
          ready: true,
          withChat: true,
        } as any)
          .then((r: any) => {
            expect(r?.ok).to.equal(true);
          });
      });
  });

  it('loads combat panel with visual arena and verifies state', () => {
    // Setup intercepts before visit
    cy.intercept('GET', '**/api/characters')
      .as('getCharacters');
    cy.intercept('GET', '**/api/combat/*/status')
      .as('combatStatus');

    cy.visit('/home');

    // Get character and navigate directly to game
    cy.wait('@getCharacters')
      .then((interception) => {
        const chars = interception?.response?.body || [];
        expect(chars.length).to.be.greaterThan(0);
        const charId = chars[0].characterId;

        // Navigate directly to game route with character
        cy.visit(`/${charId}/game`);

        // Wait for combat status to load
        cy.wait('@combatStatus', { timeout: 10000 });

        // Combat Panel should be visible with arena
        cy.get('[data-cy="combat-panel"]', { timeout: 10000 })
          .should('exist');

        cy.get('[data-cy="combat-arena"]', { timeout: 5000 })
          .should('exist');

        // Check that PixiJS canvas was created
        cy.get('[data-cy="combat-arena"] canvas', { timeout: 5000 })
          .should('exist')
          .and('be.visible');

        // Verify combat state via API
        cy.wait('@combatStatus')
          .its('response.body')
          .should((body: any) => {
            expect(body.inCombat).to.be.true;
            expect(body.enemies).to.be.an('array');
            expect(body.enemies.length).to.be.greaterThan(0);
            expect(body.player).to.exist;
            expect(body.player.hp).to.be.a('number');
          });

        // Check that combat header displays round number
        cy.get('[data-cy="combat-round"]', { timeout: 5000 })
          .should('exist')
          .and('contain.text', 'Round');
      });
  });
});
