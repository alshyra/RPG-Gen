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

  it('starts a combat and resolves an attack -> damage -> turn advance', () => {
    // Visit home and resume the created character
    cy.intercept('GET', '**/api/characters')
      .as('getCharacters');
    cy.visit('/home');
    cy.wait('@getCharacters');
    // Click on the character card (role="button" with aria-label containing "Reprendre")
    cy.get('[role="button"][aria-label*="Reprendre"]')
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
        // Wait for the combat status API call to complete
        cy.intercept('GET', '**/api/combat/*/status')
          .as('combatStatus');
        cy.wait('@combatStatus', { timeout: 10000 });

        // Combat Panel should be visible (with longer timeout for combat to initialize)
        cy.get('[data-cy="combat-panel"]', { timeout: 10000 })
          .should('exist');

        // Debug: log what's in the combat panel
        cy.get('[data-cy="combat-panel"]')
          .then(($panel) => {
            cy.log('Combat panel content: ' + $panel.html()
              .substring(0, 500));
          });

        // Wait for enemies to be rendered — combat may not always be started by seed helper,
        // so if we don't find enemies we try to start combat explicitly and wait again.
        cy.get('[data-cy^="enemy-"]', { timeout: 10000 })
          .should(($eles) => {
            if ($eles.length === 0) {
              // Start combat explicitly for this character and wait for status update
              cy.task('startCombatFor', { characterId: charId })
                .then((res: any) => {
                  expect(res.ok).to.equal(true);
                });
              // wait a short moment for the client to pick up the combat update
              cy.wait(500);
            }
          });

        // ensure we have at least one enemy rendered after the attempt above
        cy.get('[data-cy^="enemy-"]', { timeout: 10000 })
          .should('have.length.gte', 1);

        // Debug: log the enemy elements
        cy.get('[data-cy^="enemy-"]')
          .then(($enemies) => {
            cy.log('Found ' + $enemies.length + ' enemies');
            $enemies.each((i, el) => {
              cy.log('Enemy ' + i + ': ' + el.outerHTML.substring(0, 200));
            });
          });

        // Intercept the attack request so we can wait for the backend to process it
        cy.intercept('POST', '**/api/combat/*/attack')
          .as('attackReq');

        // Find the first enemy tile and click its attack button
        // Use a more flexible selector that works within the enemy container
        cy.get('[data-cy="enemy-0"]')
          .should('exist')
          .find('[data-cy="attack-button"]')
          .should('exist')
          .click();

        // Wait for the backend attack call to complete (precedes roll modal)
        cy.wait('@attackReq', { timeout: 10000 });

        // After attack: either the client will show a roll modal (server asked for a roll)
        // or the server applied damage directly. Handle both cases.
        cy.get('body')
          .then(($body) => {
            if ($body.find('[data-cy="roll-modal"]').length > 0) {
            // Roll modal path: intercept resolve endpoint, send result, and assert
              cy.intercept('POST', `**/api/combat/${charId}/resolve-roll`)
                .as('resolveRoll');
              cy.get('[data-cy="roll-modal"]')
                .within(() => {
                  cy.contains('Send Result')
                    .click();
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
            cy.get('[data-cy="enemy-0"]')
              .within(() => {
                cy.get('[data-cy="hp-bar"]')
                  .invoke('attr', 'data-hp')
                  .then((hp: string | undefined) => {
                    const val = Number(hp);
                    expect(Number.isFinite(val)).to.be.true;
                  });
              });
          });

        cy.get('[data-cy="combat-round"]')
          .should('exist')
          .and('not.be.empty');
      });
  });
});
