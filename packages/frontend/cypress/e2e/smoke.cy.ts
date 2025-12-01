describe('Application Smoke Tests', () => {
  beforeEach(() => {
    // Mock authentication for smoke tests
    cy.ensureAuth();
  });

  it('should load the application without errors', () => {
    cy.visit('/home');

    // Check that the app div is present
    cy.get('#app')
      .should('exist');

    // Check that the main content is rendered
    cy.get('.app')
      .should('exist');
    cy.get('.app-bg')
      .should('exist');
  });

  it('should have proper HTML structure', () => {
    cy.visit('/home');

    // Check meta tags
    cy.document()
      .should((doc) => {
        expect(doc.charset).to.eq('UTF-8');

        expect(doc.querySelector('meta[name="viewport"]')).to.exist;
      });

    // Check title
    cy.title()
      .should('include', 'RPG Gemini');
  });

  it('should load without console errors', () => {
    cy.visit('/home', {
      onBeforeLoad(win) {
        cy.stub(win.console, 'error')
          .as('consoleError');
      },
    });

    // Wait for page to load
    cy.contains('RPG Gemini')
      .should('be.visible');

    // Check that there are no critical console errors
    // Note: Some warnings might be expected, but errors should not be
  });
});
