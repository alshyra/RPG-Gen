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
      .type('e2e-character')
      .should('have.value', 'e2e-character');
    cy.contains('♂️ Homme')
      .click();
    cy.contains('div', 'Humain')
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

    // skills - pick specific skills we care about if they exist (keep the spirit of the original test)
    cy.get('[data-testid="ui-checkbox"][for="skill-Persuasion"]')
      .click();
    cy.get('[data-testid="ui-checkbox"][for="skill-Stealth"]')
      .click();
    cy.get('[data-testid="ui-checkbox"][for="skill-Performance"]')
      .click();
    cy.contains('button', 'Suivant')
      .click();

    // spells - select specific Bard cantrips and level-1 spells
    // cantrips (choose 2): Main de mage, Message
    cy.contains('Main de mage')
      .parent()
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains('Message')
      .parent()
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });

    // level-1 spells (choose 4): Mot de guérison, Soins, Murmures dissonants, Sommeil
    cy.contains('Mot de guérison')
      .parent()
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains('Soins')
      .parent()
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains('Murmures dissonants')
      .parent()
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains('Sommeil')
      .parent()
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });

    cy.contains('button', 'Suivant')
      .click();

    // inventory
    cy.contains('button', 'Suivant')
      .click();

    // finish with avatar generation stubbed & final save stub
    // ensure we capture the final save and avatar generation
    cy.intercept('PUT', '**/api/characters/*')
      .as('updateCharacterFinish');
    cy.contains('button', 'Terminer')
      .should('not.be.disabled')
      .click();
    // final PUT should happen first (saveFinalCharacter), then avatar generation
    cy.wait('@updateCharacterFinish');
    cy.wait('@generateAvatarGlobal');
    cy.url()
      .should('match', /\/game\/[^/]+/);
  });
});
