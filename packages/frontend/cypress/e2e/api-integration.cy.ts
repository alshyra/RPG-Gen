describe("API Integration", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.setupApiMocks();
    cy.mockAuth();
    cy.visit("/");
  });

  it("should handle API calls gracefully", () => {
    cy.intercept("POST", "/api/**", {
      statusCode: 200,
      body: {
        success: true,
        message: "Test response",
      },
    }).as("apiCall");

    cy.contains("RPG Gemini").should("be.visible");
  });

  it("should handle API errors gracefully", () => {
    cy.intercept("POST", "/api/**", {
      statusCode: 500,
      body: {
        error: "Internal Server Error",
      },
    }).as("apiError");

    cy.visit("/home");
    cy.contains("RPG Gemini").should("be.visible");
  });

  it("should work offline (no backend)", () => {
    cy.visit("/home");

    cy.contains("RPG Gemini").should("be.visible");
    cy.contains("Choisir un univers").should("be.visible");

    cy.contains("Dungeons & Dragons").should("be.visible");
  });
});
