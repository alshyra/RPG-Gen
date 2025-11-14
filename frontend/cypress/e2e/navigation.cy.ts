describe("Navigation", () => {
  beforeEach(() => {
    // Setup API mocks
    cy.setupApiMocks();
    
    // Mock authentication for navigation tests
    cy.mockAuth();
  });

  it("should navigate between routes", () => {
    // Start at home
    cy.visit("/home");
    cy.contains("RPG Gemini").should("be.visible");

    // Test direct navigation to character creation
    cy.visit("/character");
    cy.url().should("include", "/character");

    // Navigate back to home
    cy.visit("/home");
    cy.url().should("include", "/home");
  });

  it("should redirect to home when visiting /game without a character", () => {
    // Clear localStorage to ensure no character exists (but keep auth)
    localStorage.removeItem('rpg-character-id');

    // Visit /game without a character
    cy.visit("/game");

    // Should redirect to home
    cy.url().should("include", "/home");
    cy.contains("RPG Gemini").should("be.visible");
  });

  it("should handle levelup route", () => {
    cy.visit("/levelup");
    cy.url().should("include", "/levelup");
  });

  it("should handle 404 for unknown routes", () => {
    // Visit an unknown route - Vue router handles this client-side
    cy.visit("/unknown-route", { failOnStatusCode: false });
    // The app should still load
    cy.get("#app").should("exist");
  });
});
