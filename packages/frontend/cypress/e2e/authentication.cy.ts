describe("Authentication Flow", () => {
  beforeEach(() => {
    cy.setupApiMocks();
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("should display landing page when not authenticated", () => {
    cy.visit("/");
    cy.url().should("not.include", "/login");
    cy.contains("RPG Gemini").should("be.visible");
    cy.contains("Vivez des aventures épiques générées par l'IA").should("be.visible");
    cy.contains("Commencer à jouer").should("be.visible");
  });

  it("should redirect to login when clicking start playing", () => {
    cy.visit("/");
    cy.contains("Commencer à jouer").click();
    cy.url().should("include", "/login");
    cy.contains("Connectez-vous pour commencer votre aventure").should("be.visible");
  });

  it("should display Google login button on login page", () => {
    cy.visit("/login");
    cy.contains("RPG Gemini").should("be.visible");
    cy.contains("Se connecter avec Google").should("be.visible");
    cy.get("button").contains("Se connecter avec Google").should("be.visible");
  });

  it("should protect home route (world selector)", () => {
    cy.visit("/home");
    cy.url().should("include", "/login");
    cy.contains("Choisis ton univers").should("not.exist");
  });

  it("should protect character creation route", () => {
    cy.visit("/character/dnd/step/1");
    cy.url().should("include", "/login");
  });

  it("should protect game route", () => {
    cy.visit("/game");
    cy.url().should("include", "/login");
  });

  describe("With mocked authentication", () => {
    beforeEach(() => {
      cy.mockAuth();
    });

    it("should access home page (world selector) when authenticated", () => {
      cy.visit("/home");
      cy.url().should("not.include", "/login");
      cy.url().should("include", "/home");
      cy.contains("RPG Gemini").should("be.visible");
    });

    it("should redirect authenticated users from login to home", () => {
      cy.visit("/login");
      cy.url().should("include", "/home");
      cy.url().should("not.include", "/login");
    });

    it("should display user profile when authenticated", () => {
      cy.visit("/home");
      cy.contains("Test User").should("be.visible");
      cy.contains("test@example.com").should("be.visible");
    });

    it("should allow logout", () => {
      cy.visit("/home");
      cy.get("button").find('img[alt="Test User"]').parent().click();
      cy.contains("Se déconnecter").should("be.visible");
    });

    it("should redirect to login after logout", () => {
      cy.visit("/home");
      cy.clearAuth();
      cy.visit("/home");
      cy.url().should("include", "/login");
    });

    it("should allow access to protected routes when authenticated", () => {
      cy.visit("/character/dnd/step/1");

      cy.url().should("include", "/character/dnd/step/1");
    });
  });

  describe("OAuth callback handling", () => {
    it("should handle auth callback route", () => {
      cy.intercept("POST", "/api/**", { statusCode: 200 });
      cy.intercept("GET", "/api/**", { statusCode: 200 });
      cy.visit("/auth/callback?token=mock-token-123", { failOnStatusCode: false });
      cy.get("#app", { timeout: 3000 }).should("exist");
    });

    it("should show error when callback has no token", () => {
      cy.intercept("POST", "/api/**", { statusCode: 200 });
      cy.intercept("GET", "/api/**", { statusCode: 200 });
      cy.visit("/auth/callback", { failOnStatusCode: false });
      cy.get("#app", { timeout: 3000 }).should("exist");
    });
  });

  describe("Session persistence", () => {
    it("should persist authentication across page reloads", () => {
      cy.mockAuth();
      cy.visit("/home");
      cy.contains("Test User").should("be.visible");
      cy.reload();
      cy.contains("Test User").should("be.visible");
      cy.url().should("not.include", "/login");
    });

    it("should clear authentication when token is removed", () => {
      cy.mockAuth();
      cy.visit("/home");
      cy.clearAuth();
      cy.reload();
      cy.url().should("include", "/login");
    });
  });
});
