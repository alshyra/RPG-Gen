import "./commands";

Cypress.on("uncaught:exception", (err) => {
  if (
    err.message.includes("Network") ||
    err.message.includes("fetch") ||
    err.message.includes("Failed to fetch")
  ) {
    return false;
  }
  return true;
});

Cypress.Commands.add("clearAuth", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("rpg-auth-token");
    win.localStorage.removeItem("rpg-user-data");
  });
});

Cypress.Commands.add('ensureAuth', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('rpg-auth-token', 'e2e-bypass-token');
  });

  // Request real profile — fail if not present so tests don't silently pass with a mock.
  cy.request({ url: '/api/auth/profile', failOnStatusCode: false }).then((resp) => {
    if (resp?.status === 200 && resp?.body) {
      cy.window().then((win) => {
        win.localStorage.setItem('rpg-user-data', JSON.stringify(resp.body));
      });
      return;
    }

    throw new Error('ensureAuth failed: /api/auth/profile did not return a profile. Ensure backend is up and DISABLE_AUTH_FOR_E2E=true.');
  });
});

