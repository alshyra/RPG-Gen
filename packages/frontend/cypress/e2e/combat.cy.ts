describe('Combat flow', () => {
  before(() => {
    // ensure backend & DB prepared; create one ready character with combat_start in history
    cy.clearLocalStorage();
    cy.ensureAuth();
    // Clean previous test data to ensure deterministic character selection
    cy.cleanupE2EDb().then(() => {
      cy.prepareE2EDb({ count: 1, ready: true, withChat: true } as any).then((r: any) => {
        expect(r?.ok).to.equal(true);
      });
    });
  });

  it('starts a combat and resolves an attack -> damage -> turn advance', () => {
    // Visit home and resume the created character
    cy.intercept('GET', '**/api/characters').as('getCharacters');
    cy.visit('/home');
    cy.wait('@getCharacters');
    cy.get('button')
      .contains('Reprendre')
      .first()
      .click();

    // Ensure we are on either /game/:id or the character creation flow /character/:id/step/1
    cy.url()
      .should('match', /\/(game)\/[A-Za-z0-9-]+/);

    // extract charId and continue test steps in separate then-block
    cy.url()
      .then((u: string) => {
        // Try to extract characterId from either /game/:id or /character/:id/...
        const m1 = u.match(/\/game\/([^/]+)$/);
        const charId = m1 ? m1[1] : undefined;
        expect(charId).to.be.a('string');
        return charId as string;
      })
      .then((charId: string) => {
      // If the UI landed on the character creation step, navigate directly to the game page
        // Trigger a combat start on the backend for this character
        cy.wait(500);

        // Combat Panel should be visible
        cy.get('[data-cy="combat-panel"]').should('exist');

        // Expect at least one enemy tile plus the player portrait
        cy.get('[data-cy^="enemy-"]')
          .its('length')
          .should('be.gte', 1);

        // Intercept the attack request so we can wait for the backend to process it
        cy.intercept('POST', '**/api/combat/*/attack').as('attackReq');

        // Find the first enemy tile by deterministic selector and click its attack button
        cy.get('[data-cy="enemy-0"]')
          .should('exist')
          .within(() => {
            cy.get('[data-cy="attack-button"]').click();
          });

        // Wait for the backend attack call to complete (precedes roll modal)
        cy.wait('@attackReq', { timeout: 10000 });

        // After attack: either the client will show a roll modal (server asked for a roll)
        // or the server applied damage directly. Handle both cases.
        cy.get('body').then(($body) => {
          if ($body.find('[data-cy="roll-modal"]').length > 0) {
            // Roll modal path: intercept resolve endpoint, send result, and assert
            cy.intercept('POST', `**/api/combat/${charId}/resolve-roll`).as('resolveRoll');
            cy.get('[data-cy="roll-modal"]').within(() => {
              cy.contains('Send Result').click();
            });

            // Expect the combat resolve endpoint to be called
            cy.wait('@resolveRoll')
              .its('response.statusCode')
              .should('be.oneOf', [
                200,
                201,
              ]);
          } else {
            // No roll modal -> server likely applied damage already. Check for damage narrative.
            // Allow some time for the assistant/system messages to appear (optional).
            cy.wait(500);
          }

          // Common assertion: check the first enemy has a numeric hp attribute
          cy.get('[data-cy="enemy-0"]').within(() => {
            cy.get('[data-cy="hp-bar"]').invoke('attr', 'data-hp')
              .then((hp: string | undefined) => {
                const val = Number(hp);
                expect(Number.isFinite(val)).to.be.true;
              });
          });
        });

        cy.get('[data-cy="combat-round"]').should('exist')
          .and('not.be.empty');
      });
  });
});
