describe('World Selection', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/');
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
    cy.get('.logo').should('have.length.at.least', 3);
    cy.contains('.logo', 'D').should('be.visible');
    cy.contains('.logo', 'V').should('be.visible');
    cy.contains('.logo', 'C').should('be.visible');
  });

  it('should have start buttons for each world', () => {
    // Each world should have a "Commencer" button
    cy.contains('button', 'Commencer').should('have.length.at.least', 3);
  });

  it('should navigate to character creation when clicking start on a world', () => {
    // Click the first "Commencer" button
    cy.contains('Dungeons & Dragons')
      .closest('.tpl')
      .find('button')
      .contains('Commencer')
      .click();

    // Should navigate to character creation page
    cy.url().should('include', '/character');
  });

  it('should store selected world in sessionStorage', () => {
    // Click on D&D world
    cy.contains('Dungeons & Dragons')
      .closest('.tpl')
      .find('button')
      .contains('Commencer')
      .click();

    // Check that the world ID is stored in sessionStorage
    cy.window().its('sessionStorage').invoke('getItem', 'selected-world')
      .should('equal', 'dnd');
  });

  it('should highlight world on hover', () => {
    // Get a world container and check hover state classes
    cy.contains('Dungeons & Dragons')
      .closest('.tpl')
      .should('have.class', 'hover:bg-slate-800/70');
  });
});
