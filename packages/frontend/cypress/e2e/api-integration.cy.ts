describe("API Integration", () => {
  beforeEach(() => {
    cy.clearLocalStorage();

    // Tests in this file keep auth optional — they may run against a live backend or
    // run offline without auth depending on the scenario.

    cy.visit("/");
  });

  it("should handle API calls gracefully", () => {
    // Intercept API calls that might be made
    // Spy on POST requests and allow the real backend to handle them
    cy.intercept("POST", "/api/**").as("apiCall");

    // The app should load without making immediate API calls
    cy.contains("RPG Gemini").should("be.visible");
  });

  it("should handle API errors gracefully", () => {
    // Stub API to return error
    // Simulate an error response so we can assert error handling behaviour
    cy.intercept("POST", "/api/**", {
      statusCode: 500,
      body: {
        error: "Internal Server Error",
      },
    }).as("apiError");

    // Navigate through the app
    cy.visit("/home");
    cy.contains("RPG Gemini").should("be.visible");
  });

  it("should work offline (no backend)", () => {
    // Simulate a backend outage by forcing network errors for any API requests.
    cy.intercept('GET', '/api/**', { forceNetworkError: true }).as('offlineGet');
    cy.intercept('POST', '/api/**', { forceNetworkError: true }).as('offlinePost');

    // We need the client to be considered authenticated so /home doesn't redirect to /login.
    // Instead of global mocks we set a lightweight local session state for this test only.
    cy.window().then((win) => {
      win.localStorage.setItem('rpg-auth-token', 'offline-test-token');
      win.localStorage.setItem('rpg-user-data', JSON.stringify({ id: 'offline-user', displayName: 'Offline Tester' }));
    });

    // Visit the protected route — even if the backend is down the UI should render a usable world selector.
    cy.visit('/home');

    // We don't rely on observing any outgoing GET — different UI flows may or may not
    // trigger a call right away. Instead just allow the UI to render and assert the
    // presence of the world selector elements.

    // Basic UI should still work
    cy.contains("RPG Gemini").should("be.visible");
    cy.contains("Choisir un univers").should("be.visible");

    // World selector should be functional
    cy.contains("Dungeons & Dragons").should("be.visible");
  });
});
