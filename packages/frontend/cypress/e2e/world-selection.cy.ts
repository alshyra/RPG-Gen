describe('World Selection', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Setup API mocks
    cy.setupApiMocks();
    
    // Mock authentication
    cy.mockAuth();
    
    cy.visit('/home');
  });

  it('should display all available worlds', () => {
    cy.contains('Choisir un univers').should('be.visible');
    
    // Check that all three worlds are displayed
    cy.contains('Dungeons & Dragons').should('be.visible');
    cy.contains('High fantasy, parties, and epic quests.').should('be.visible');
    
    cy.contains('Vampire: The Masquerade').should('be.visible');
    cy.contains('Gothic-punk political roleplay among vampires.').should('be.visible');
    
    cy.contains('Cyberpunk').should('be.visible');
    cy.contains('Near-future neon dystopia with tech & megacorps.').should('be.visible');
  });

  it('should display world logos', () => {
    // Check that world logos/initials are displayed
    cy.get('.logo').should('have.length.gte', 3);
    cy.contains('.logo', 'D').should('be.visible');
    cy.contains('.logo', 'V').should('be.visible');
    cy.contains('.logo', 'C').should('be.visible');
  });

  it('should have start buttons for each world', () => {
    // Each world should have a "Commencer" button
    cy.get('button').contains('Commencer').should('exist');
    cy.get('button').filter(':contains("Commencer")').should('have.length.gte', 3);
  });

  it('should navigate to character creation when clicking start on a world', () => {
    // Click the first "Commencer" button
    cy.contains('Dungeons & Dragons')
      .closest('.tpl')
      .find('button')
      .contains('Commencer')
      .click();

    // Should navigate to character creation page (with generated characterId)
    cy.url().should('match', /\/character\/[^/]+\/step\/1/);
  });

  it('should store selected world in sessionStorage', () => {
    // Click on D&D world
    cy.contains('Dungeons & Dragons')
      .closest('.tpl')
      .find('button')
      .contains('Commencer')
      .click();

    // After creation, check that characterId exists in the URL
    cy.url().should('match', /\/character\/[^/]+\/step\/1/);
  });

  it('should highlight world on hover', () => {
    // Get a world container and check hover state classes
    cy.contains('Dungeons & Dragons')
      .closest('.tpl')
      .should('have.class', 'hover:bg-slate-800/70');
  });
});
