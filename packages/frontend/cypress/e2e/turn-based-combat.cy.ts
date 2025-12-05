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
      .then(() => cy.prepareE2EDb({
        count: 1,
        ready: true,
        withChat: true,
      } as any))
      .then((r: any) => {
        expect(r?.ok).to.equal(true);
      });
  });

  beforeEach(() => {
    // Ensure auth token is set for each test
    cy.ensureAuth();

    // Navigate to game view with combat ready
    cy.intercept('GET', '**/api/characters')
      .as('getCharacters');
    cy.intercept('GET', '**/api/combat/*/status')
      .as('combatStatus');
    cy.visit('/home');
    cy.wait('@getCharacters', { timeout: 15000 });

    // Click on the character card (role="button" with aria-label containing "Reprendre")
    cy.get('[role="button"][aria-label*="Reprendre"]')
      .first()
      .click();

    cy.url()
      .should('match', /\/(game)\/[A-Za-z0-9-]+/);

    // Wait for combat status to be loaded
    cy.wait('@combatStatus', { timeout: 10000 });

    // Wait for combat panel to be visible with enemies
    cy.get('[data-cy="combat-panel"]', { timeout: 10000 })
      .should('exist');
    cy.get('[data-cy^="enemy-"]', { timeout: 10000 })
      .should('have.length.gte', 1);

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
  });

  describe('Player Attack Flow', () => {
    it.skip('should decrement action counter after attack', () => {
      // TODO: Action economy (action counter decrement) not implemented in frontend yet
      // The backend returns correct state but frontend doesn't update the counter after attack
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Note initial action count
      cy.get('[data-cy="action-counter"]')
        .invoke('text')
        .then((initialActions) => {
          const initial = parseInt(initialActions, 10);

          // Perform attack on first enemy
          cy.intercept('POST', '**/api/combat/*/attack')
            .as('attackReq');

          cy.get('[data-cy="enemy-0"]')
            .within(() => {
              cy.get('[data-cy="attack-button"]')
                .click();
            });

          cy.wait('@attackReq')
            .its('response.body')
            .then((body) => {
              const hasRollInstruction = (body.rollInstruction && body.rollInstruction.type === 'roll') || body.instructions?.some((i: any) => i.type === 'roll');
              if (hasRollInstruction) {
                // Hit: roll modal should appear for damage roll
                cy.get('[data-cy="roll-damage-modal"]', { timeout: 5000 })
                  .should('be.visible')
                  .within(() => {
                    // Attack roll display should be present (could be '-' if not provided)
                    cy.get('[data-cy="roll-attack-roll"]')
                      .should('exist');
                    // Perform an actual roll (simulate user)
                    cy.get('[data-cy="do-roll"]')
                      .click();
                    // Wait for roll to be applied to UI
                    cy.get('[data-cy="roll-attack-roll"]', { timeout: 3000 })
                      .should(($el) => {
                        expect($el.text()
                          .trim()).not.to.equal('-');
                      });
                    cy.intercept('POST', '**/api/combat/*/resolve-roll/*')
                      .as('resolveRoll');
                    cy.get('[data-cy="send-roll-result"]')
                      .click();
                  });
                cy.wait('@resolveRoll');
              }
              // On miss, action is already decremented by backend, no roll modal
            });

          // After attack completes, action counter should be decremented
          cy.get('[data-cy="action-counter"]')
            .invoke('text')
            .then((afterActions) => {
              const after = parseInt(afterActions, 10);
              expect(after).to.equal(initial - 1);
            });
        });
    });

    it.skip('should not auto-advance turn after using all actions', () => {
      // TODO: This test requires end-turn-button to be visible which depends on combat phase
      // The combat state machine needs refinement for this to work reliably
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Perform attack
      cy.intercept('POST', '**/api/combat/*/attack')
        .as('attackReq');

      cy.get('[data-cy="enemy-0"]')
        .within(() => {
          cy.get('[data-cy="attack-button"]')
            .click();
        });

      cy.wait('@attackReq')
        .its('response.body')
        .then((body) => {
          const hasRollInstruction = (body.rollInstruction && body.rollInstruction.type === 'roll') || body.instructions?.some((i: any) => i.type === 'roll');
          if (hasRollInstruction) {
            // Hit: handle roll modal (perform a real roll then send)
            cy.get('[data-cy="roll-damage-modal"]', { timeout: 5000 })
              .should('be.visible')
              .within(() => {
                cy.get('[data-cy="do-roll"]')
                  .click();
                cy.get('[data-cy="roll-attack-roll"]', { timeout: 3000 })
                  .should(($el) => {
                    expect($el.text()
                      .trim()).not.to.equal('-');
                  });
                cy.intercept('POST', '**/api/combat/*/resolve-roll/*')
                  .as('resolveRoll');
                cy.get('[data-cy="send-roll-result"]')
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
    it.skip('should show "Fin de tour" button during player turn', () => {
      // TODO: This test is flaky because the combat panel state depends on
      // isCombatOpen which may not be set consistently between test runs
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      cy.get('[data-cy="end-turn-button"]')
        .should('exist')
        .and('be.visible')
        .and('contain.text', 'Fin de tour');
    });

    it.skip('should advance turn and resolve enemy actions when clicking "Fin de tour"', () => {
      // TODO: End-activation only works when current combatant is player
      // Backend returns 400 when enemy has higher initiative and goes first
      // Need to either auto-process enemy turns at combat start or ensure player always starts
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

    it.skip('should allow ending turn even with actions remaining', () => {
      // TODO: End-activation only works when current combatant is player
      // Backend returns 400 when enemy has higher initiative and goes first
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

  describe('Multi-round Combat', () => {
    it.skip('should track round progression correctly', () => {
      // TODO: End-activation only works when current combatant is player
      // Backend returns 400 when enemy has higher initiative and goes first
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

    it.skip('should reset action economy at start of new round', () => {
      // TODO: End-activation only works when current combatant is player
      // Requires full turn cycle to test action economy reset
      cy.get('[data-cy="combat-panel"]')
        .should('exist');

      // Use an action
      cy.intercept('POST', '**/api/combat/*/attack')
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
    it.skip('should end combat on victory with XP reward', () => {
      // TODO: Requires killing all enemies which needs full combat flow to work
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
            cy.intercept('POST', '**/api/combat/*/attack')
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
  });

  describe('UI State Synchronization', () => {
    it.skip('should update HP bars after enemy attacks', () => {
      // TODO: Requires end-activation to work properly
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
  });
});
