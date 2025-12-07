describe('Character creation single flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.ensureAuth();
    // stub avatar generator globally for the spec
    cy.intercept('POST', '/api/image/generate-avatar', {
      statusCode: 200,
      body: { imageUrl: 'data:image/png;base64,dummy' },
    })
      .as('generateAvatarGlobal');
    cy.visit('/home');
  });

  it('should allow user to create a character', () => {
    // start creation
    cy.contains('button', 'Créer un personnage')
      .click();
    cy.url()
      .should('match', /\/character\/[^/]+\/step\/1/);

    // basic info
    cy.get('input[placeholder="Ex: Aragorn"]')
      .clear()
      .type('e2e-character');
    cy.contains('♂️ Homme')
      .click();
    cy.contains('Humain')
      .click();
    cy.contains('button', 'Suivant')
      .should('not.be.disabled')
      .click();

    // class selection + ability score interactions
    cy.get('select')
      .select('Bard')
      .should('have.value', 'Bard');
    cy.get('[data-test-id="ability-score-Cha"]')
      .should('exist');

    // persist some ability changes and assert they hit the API
    cy.intercept('PUT', '**/api/characters/*')
      .as('updateCharacter');
    cy.get('[data-test-id="ability-score-Str"]')
      .contains('-')
      .click()
      .click()
      .click()
      .click()
      .click()
      .click()
      .click();
    cy.get('[data-test-id=ability-score-Str] [data-test-id="ability-score"]')
      .should('contain', '8');
    cy.get('[data-test-id="ability-score-Dex"]')
      .contains('+')
      .click();
    cy.get('[data-test-id=ability-score-Dex] [data-test-id="ability-score"]')
      .should('contain', '15');

    cy.get('[data-test-id="ability-score-Int"]')
      .contains('-')
      .click()
      .click();
    cy.get('[data-test-id=ability-score-Int] [data-test-id="ability-score"]')
      .should('contain', '10');
    cy.get('[data-test-id="ability-score-Cha"]')
      .contains('+')
      .click()
      .click()
      .click()
      .click()
      .click()
      .click()
      .click();
    cy.get('[data-test-id=ability-score-Cha] [data-test-id="ability-score"]')
      .should('contain', '15');
    cy.wait('@updateCharacter');

    // skills - pick first two if available
    cy.contains('button', 'Suivant')
      .should('not.be.disabled')
      .click();
    cy.get('input[type="checkbox"][name="skill-Persuasion"]')
      .check();
    cy.get('input[type="checkbox"][name="skill-Stealth"]')
      .check();
    cy.get('input[type="checkbox"][name="skill-Performance"]')
      .check();
    cy.contains('button', 'Suivant')
      .click();

    // spells - pick first checkbox if present
    cy.get('[data-testid="ui-checkbox"][name="skill-Persuasion"]')
      .click();
    cy.contains('button', 'Suivant')
      .click();

    // inventory
    cy.contains('button', 'Suivant')
      .click();

    // finish with avatar generation stubbed & final save stub
    cy.contains('button', 'Terminer')
      .should('not.be.disabled')
      .click();
    cy.wait('@generateAvatarGlobal');
    cy.intercept('PUT', '**/api/characters/*')
      .as('updateCharacterFinish');
    cy.wait('@updateCharacterFinish');
    cy.url()
      .should('match', /\/game\/[^/]+/);
  });
});
