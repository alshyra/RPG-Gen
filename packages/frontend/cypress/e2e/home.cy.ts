describe('Home Page', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Setup API mocks to prevent timeouts
    cy.setupApiMocks();
    
    // Mock authentication for these tests
    cy.mockAuth();
    
    cy.visit('/home');
  });

  it('should load the home page successfully', () => {
    cy.contains('RPG Gemini').should('be.visible');
    cy.contains('Un moteur d\'aventure assisté par Gemini').should('be.visible');
  });

  it('should display the world selector', () => {
    // The WorldSelector component should be present
    cy.get('h1').contains('RPG Gemini').should('exist');
  });

  it('should display message when no characters exist', () => {
    // With empty characters array from API mock, should show the no characters message
    cy.contains('Aucun personnage créé').should('be.visible');
    cy.contains('Sélectionnez un univers ci-dessous pour commencer').should('be.visible');
  });

  it('should display character list when characters exist', () => {
    // Mock API with characters
    const mockCharacters = [
      {
        characterId: 'char-1',
        name: 'Aragorn',
        race: { id: 'human', name: 'Humain', mods: {} },
        scores: { Str: 16, Dex: 14, Con: 15, Int: 12, Wis: 13, Cha: 14 },
        hp: 15,
        hpMax: 15,
        totalXp: 300,
        classes: [{ name: 'Ranger', level: 2 }],
        skills: [],
        world: 'dnd',
        portrait: '',
        gender: 'male',
        proficiency: 2,
        state: 'created',
      },
      {
        characterId: 'char-2',
        name: 'Gandalf',
        race: { id: 'human', name: 'Humain', mods: {} },
        scores: { Str: 10, Dex: 12, Con: 14, Int: 18, Wis: 16, Cha: 15 },
        hp: 20,
        hpMax: 25,
        totalXp: 1000,
        classes: [{ name: 'Wizard', level: 5 }],
        skills: [],
        world: 'dnd',
        portrait: '',
        gender: 'male',
        proficiency: 3,
        state: 'created',
      }
    ];

    cy.intercept('GET', '**/api/characters', {
      statusCode: 200,
      body: mockCharacters
    }).as('getCharactersWithData');

    cy.visit('/home');
    cy.wait('@getCharactersWithData');

    // Should display "Mes personnages" header
    cy.contains('Mes personnages').should('be.visible');

    // Should display both characters
    cy.contains('Aragorn').should('be.visible');
    cy.contains('Gandalf').should('be.visible');

    // Should display character details
    cy.contains('Ranger Niveau 2').should('be.visible');
    cy.contains('Wizard Niveau 5').should('be.visible');
    cy.contains('HP: 15/15').should('be.visible');
    cy.contains('HP: 20/25').should('be.visible');

    // Should have resume and delete buttons for each character
    cy.get('button').contains('Reprendre').should('exist');
    cy.get('button').contains('Supprimer').should('exist');
    // Verify we have 2 of each by checking all buttons
    cy.get('button').filter(':contains("Reprendre")').should('have.length', 2);
    cy.get('button').filter(':contains("Supprimer")').should('have.length', 2);
  });

  it('should navigate to character creation when world is selected', () => {
    // This test would need to interact with WorldSelector
    // For now, we just verify the page structure is correct
    // Use data-cy selector to choose a world and assert we navigate to the character creation flow
    cy.dataCy('world-start-dnd').click();
    // Should navigate to the character creation route (with generated characterId)
    cy.url().should('match', /\/character\/[^/]+\/step\/1/);
    // Confirm the character creation wizard header is visible
    cy.contains('Création de personnage').should('be.visible');
  });
});
