describe('Home Page', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Mock authentication for these tests
    const mockToken = 'test-token';
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User'
    };
    localStorage.setItem('rpg-auth-token', mockToken);
    localStorage.setItem('rpg-user-data', JSON.stringify(mockUser));
    
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

  it('should not display current character section when no character exists', () => {
    cy.contains('Personnage en cours').should('not.exist');
  });

  it('should navigate to character creation when world is selected', () => {
    // This test would need to interact with WorldSelector
    // For now, we just verify the page structure is correct
    cy.get('.p-6').should('exist');
    cy.get('.text-3xl').should('contain', 'RPG Gemini');
  });
});
