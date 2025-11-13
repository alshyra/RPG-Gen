// Support file for E2E tests
// Add custom commands here if needed

beforeEach(() => {
  // Clear localStorage before each test
  cy.window().then(win => {
    win.localStorage.clear();
  });
});
