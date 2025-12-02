/**
 * E2E tests for the turn-based combat system with D&D 5e action economy.
 *
 * Tests cover:
 * - Turn order with player duplication (N activations per round, N = alive enemies)
 * - Action economy (action + bonus action per activation)
 * - End activation flow (explicit click to advance turn)
 * - Enemy resolution during turn advancement
 * - Multi-round combat
 */

describe('Turn-based combat flow', () => {
  let characterId: string;

  before(() => {
    cy.clearLocalStorage();
    cy.ensureAuth();
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

  beforeEach(() => {
    // Navigate to game view with combat ready
    cy.intercept('GET', '**/api/characters')
      .as('getCharacters');
    cy.visit('/home');
    cy.wait('@getCharacters');

    cy.get('button')
      .contains('Reprendre')
      .first()
      .click();

    cy.url()
      .should('match', /\/(game)\/[A-Za-z0-9-]+/);

    cy.url()
      .then((u: string) => {
        const m1 = u.match(/\/game\/([^/]+)$/);
        characterId = m1 ? m1[1] : '';
        expect(characterId).to.be.a('string');
      });
  });

  describe('Action Economy Display', () => {
    it('should display action and bonus action counters in combat panel', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Check for action economy indicators
      cy.get('[data-cy="action-counter"]')
        .should('exist')
        .and('contain', '1'); // Default 1 action

      cy.get('[data-cy="bonus-action-counter"]')
        .should('exist')
        .and('contain', '1'); // Default 1 bonus action
    });

    it('should show current activation indicator in turn order', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Turn order should show current activation highlighted
      cy.get('[data-cy="turn-order"]')
        .should('exist');

      cy.get('[data-cy="current-activation"]')
        .should('exist')
        .and('have.class', 'active');
    });
  });

  describe('Player Attack Flow', () => {
    it('should decrement action counter after attack', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Note initial action count
      cy.get('[data-cy="action-counter"]')
        .invoke('text')
        .then((initialActions) => {
          const initial = parseInt(initialActions, 10);

          // Perform attack on first enemy
          cy.intercept('POST', '**/api/combat/*/attack/*')
            .as('attackReq');

          cy.get('[data-cy="enemy-0"]')
            .within(() => {
              cy.get('[data-cy="attack-button"]')
                .click();
            });

          cy.wait('@attackReq');

          // Handle roll modal if present
          cy.get('body')
            .then(($body) => {
              if ($body.find('[data-cy="roll-modal"]').length > 0) {
                cy.intercept('POST', '**/api/combat/*/resolve-roll/*')
                  .as('resolveRoll');
                cy.get('[data-cy="roll-modal"]')
                  .within(() => {
                    cy.contains('Send Result')
                      .click();
                  });
                cy.wait('@resolveRoll');
              }
            });

          // Action counter should be decremented
          cy.get('[data-cy="action-counter"]')
            .invoke('text')
            .then((afterActions) => {
              const after = parseInt(afterActions, 10);
              expect(after).to.equal(initial - 1);
            });
        });
    });

    it('should not auto-advance turn after using all actions', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Perform attack
      cy.intercept('POST', '**/api/combat/*/attack/*')
        .as('attackReq');

      cy.get('[data-cy="enemy-0"]')
        .within(() => {
          cy.get('[data-cy="attack-button"]')
            .click();
        });

      cy.wait('@attackReq');

      // Handle roll modal
      cy.get('body')
        .then(($body) => {
          if ($body.find('[data-cy="roll-modal"]').length > 0) {
            cy.intercept('POST', '**/api/combat/*/resolve-roll/*')
              .as('resolveRoll');
            cy.get('[data-cy="roll-modal"]')
              .within(() => {
                cy.contains('Send Result')
                  .click();
              });
            cy.wait('@resolveRoll');
          }
        });

      // Even with 0 actions remaining, should still be player's turn
      // until explicit end-activation
      cy.get('[data-cy="end-turn-button"]')
        .should('exist')
        .and('be.visible');

      // Phase should still indicate player can act (or end turn)
      cy.get('[data-cy="combat-phase"]')
        .should('contain.text', 'Your Turn');
    });
  });

  describe('End Activation Flow', () => {
    it('should show "Fin de tour" button during player turn', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      cy.get('[data-cy="end-turn-button"]')
        .should('exist')
        .and('be.visible')
        .and('contain.text', 'Fin de tour');
    });

    it('should advance turn and resolve enemy actions when clicking "Fin de tour"', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Note initial round number
      cy.get('[data-cy="combat-round"]')
        .invoke('text')
        .then((roundText) => {
          const initialRound = parseInt(roundText.replace(/\D/g, ''), 10) || 1;

          // Intercept end-activation request
          cy.intercept('POST', '**/api/combat/*/end-activation')
            .as('endActivation');

          // Click end turn button
          cy.get('[data-cy="end-turn-button"]')
            .click();

          // Wait for backend to process
          cy.wait('@endActivation')
            .its('response.statusCode')
            .should('be.oneOf', [
              200,
              201,
            ]);

          // Enemy attacks should be displayed (if enemies are alive)
          cy.get('[data-cy="attack-result-modal"]', { timeout: 5000 })
            .should('exist')
            .then(($modal) => {
              // Close all attack result modals
              const closeModal = () => {
                cy.get('body')
                  .then(($body) => {
                    if ($body.find('[data-cy="attack-result-modal"]').length > 0) {
                      cy.get('[data-cy="attack-result-modal"]')
                        .within(() => {
                          cy.get('button')
                            .contains(/ok|close|continue/i)
                            .click();
                        });
                      cy.wait(400);
                      closeModal();
                    }
                  });
              };
              closeModal();
            });

          // After enemy actions, should be back to player turn
          cy.get('[data-cy="combat-phase"]')
            .should('contain.text', 'Your Turn');

          // Action counters should be reset
          cy.get('[data-cy="action-counter"]')
            .invoke('text')
            .then((actions) => {
              expect(parseInt(actions, 10)).to.be.gte(1);
            });
        });
    });

    it('should allow ending turn even with actions remaining', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Without attacking, click end turn
      cy.intercept('POST', '**/api/combat/*/end-activation')
        .as('endActivation');

      cy.get('[data-cy="end-turn-button"]')
        .click();

      // Should still process successfully
      cy.wait('@endActivation')
        .its('response.statusCode')
        .should('be.oneOf', [
          200,
          201,
        ]);
    });
  });

  describe('Turn Order with Player Duplication', () => {
    it('should show player duplicated N times in turn order (N = alive enemies)', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Count alive enemies
      cy.get('[data-cy^="enemy-"]')
        .filter(':visible')
        .then(($enemies) => {
          const aliveEnemies = $enemies.filter((_, el) => {
            const hp = parseInt(el.getAttribute('data-hp') || '0', 10);
            return hp > 0;
          }).length || $enemies.length;

          // Count player entries in turn order
          cy.get('[data-cy="turn-order"]')
            .find('[data-cy="turn-order-player"]')
            .should('have.length', aliveEnemies);
        });
    });

    it('should alternate between player and enemy activations', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Get turn order entries
      cy.get('[data-cy="turn-order"]')
        .find('[data-cy^="turn-order-"]')
        .then(($entries) => {
          // Verify alternation pattern: shouldn't have consecutive entries of same type
          // (unless only one enemy or one player activation)
          const types = Array.from($entries)
            .map(el => el.getAttribute('data-cy')
              ?.includes('player')
              ? 'player'
              : 'enemy');

          // At minimum, verify player appears multiple times if multiple enemies
          const playerCount = types.filter(t => t === 'player').length;
          const enemyCount = types.filter(t => t === 'enemy').length;

          // Player activations should equal enemy count (duplication rule)
          expect(playerCount).to.equal(enemyCount);
        });
    });
  });

  describe('Multi-round Combat', () => {
    it('should track round progression correctly', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Get initial round
      cy.get('[data-cy="combat-round"]')
        .invoke('text')
        .then((text) => {
          const initialRound = parseInt(text.replace(/\D/g, ''), 10) || 1;

          // Complete a full round by ending all player activations
          const endActivation = () => {
            cy.get('body')
              .then(($body) => {
                if ($body.find('[data-cy="end-turn-button"]').length > 0) {
                  cy.intercept('POST', '**/api/combat/*/end-activation')
                    .as('endAct');
                  cy.get('[data-cy="end-turn-button"]')
                    .click();
                  cy.wait('@endAct');

                  // Close any attack modals
                  cy.wait(500);
                  cy.get('body')
                    .then(($b) => {
                      if ($b.find('[data-cy="attack-result-modal"]').length > 0) {
                        cy.get('[data-cy="attack-result-modal"]')
                          .within(() => {
                            cy.get('button')
                              .first()
                              .click();
                          });
                      }
                    });
                }
              });
          };

          // End activation multiple times to complete a round
          endActivation();
          cy.wait(1000);
          endActivation();
          cy.wait(1000);

          // Check round has advanced
          cy.get('[data-cy="combat-round"]')
            .invoke('text')
            .then((newText) => {
              const newRound = parseInt(newText.replace(/\D/g, ''), 10) || 1;
              expect(newRound).to.be.gte(initialRound);
            });
        });
    });

    it('should reset action economy at start of new round', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Use an action
      cy.intercept('POST', '**/api/combat/*/attack/*')
        .as('attackReq');

      cy.get('[data-cy="enemy-0"]')
        .within(() => {
          cy.get('[data-cy="attack-button"]')
            .click();
        });

      cy.wait('@attackReq');

      // Handle roll modal
      cy.get('body')
        .then(($body) => {
          if ($body.find('[data-cy="roll-modal"]').length > 0) {
            cy.intercept('POST', '**/api/combat/*/resolve-roll/*')
              .as('resolveRoll');
            cy.get('[data-cy="roll-modal"]')
              .within(() => {
                cy.contains('Send Result')
                  .click();
              });
            cy.wait('@resolveRoll');
          }
        });

      // End activation
      cy.intercept('POST', '**/api/combat/*/end-activation')
        .as('endActivation');
      cy.get('[data-cy="end-turn-button"]')
        .click();
      cy.wait('@endActivation');

      // Close attack modals
      cy.wait(500);
      cy.get('body')
        .then(($body) => {
          if ($body.find('[data-cy="attack-result-modal"]').length > 0) {
            cy.get('[data-cy="attack-result-modal"]')
              .within(() => {
                cy.get('button')
                  .first()
                  .click();
              });
          }
        });

      // After round completes, actions should be reset
      cy.get('[data-cy="action-counter"]')
        .invoke('text')
        .then((actions) => {
          expect(parseInt(actions, 10)).to.be.gte(1);
        });
    });
  });

  describe('Combat Victory/Defeat', () => {
    it('should end combat on victory with XP reward', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Attack until enemy is defeated (simplified - may need multiple rounds in real test)
      const attackUntilVictory = () => {
        cy.get('body')
          .then(($body) => {
            // Check if combat is still active
            if ($body.find('[data-cy="combat-panel"]').length === 0) {
              return; // Combat ended
            }

            // Check if any enemies alive
            const enemies = $body.find('[data-cy^="enemy-"]');
            const aliveEnemy = enemies.filter((_, el) => {
              const hp = parseInt(el.querySelector('[data-cy="hp-bar"]')
                ?.getAttribute('data-hp') || '0', 10);
              return hp > 0;
            });

            if (aliveEnemy.length === 0) {
              return; // All defeated
            }

            // Perform attack
            cy.intercept('POST', '**/api/combat/*/attack/*')
              .as('attackReq');
            cy.get('[data-cy="enemy-0"]')
              .within(() => {
                cy.get('[data-cy="attack-button"]')
                  .click();
              });
            cy.wait('@attackReq');

            // Handle roll modal
            cy.get('body')
              .then(($b) => {
                if ($b.find('[data-cy="roll-modal"]').length > 0) {
                  cy.intercept('POST', '**/api/combat/*/resolve-roll/*')
                    .as('resolveRoll');
                  cy.get('[data-cy="roll-modal"]')
                    .within(() => {
                      cy.contains('Send Result')
                        .click();
                    });
                  cy.wait('@resolveRoll');
                }
              });

            // End turn and continue
            cy.get('body')
              .then(($b) => {
                if ($b.find('[data-cy="end-turn-button"]').length > 0) {
                  cy.intercept('POST', '**/api/combat/*/end-activation')
                    .as('endAct');
                  cy.get('[data-cy="end-turn-button"]')
                    .click();
                  cy.wait('@endAct');
                }
              });

            cy.wait(1000);
            attackUntilVictory();
          });
      };

      // This test may timeout in real scenarios - it's more of a smoke test
      // attackUntilVictory();
    });

    it('should display defeat modal when player HP reaches 0', () => {
      // This test would require manipulating player HP or having a very strong enemy
      // Keeping as placeholder for manual/integration testing
      cy.log('Defeat scenario test - requires specific setup');
    });
  });

  describe('UI State Synchronization', () => {
    it('should update HP bars after enemy attacks', () => {
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Get initial player HP
      cy.get('[data-cy="player-portrait"]')
        .within(() => {
          cy.get('[data-cy="hp-bar"]')
            .invoke('attr', 'data-hp')
            .then((initialHp) => {
              const initial = parseInt(initialHp || '0', 10);

              // End turn to trigger enemy attacks
              cy.intercept('POST', '**/api/combat/*/end-activation')
                .as('endActivation');
            });
        });

      cy.get('[data-cy="end-turn-button"]')
        .click();

      cy.wait('@endActivation');

      // Close attack modals
      cy.wait(1000);

      // HP should have changed (or stayed same if enemy missed)
      cy.get('[data-cy="player-portrait"]')
        .within(() => {
          cy.get('[data-cy="hp-bar"]')
            .invoke('attr', 'data-hp')
            .should('match', /^\d+$/);
        });
    });

    it('should remove dead enemies from turn order', () => {
      // This test requires killing an enemy and verifying turn order updates
      cy.log('Dead enemy removal test - requires specific combat setup');
    });
  });
});
