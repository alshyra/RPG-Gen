import './commands';

Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('Network')
    || err.message.includes('fetch')
    || err.message.includes('Failed to fetch')
  ) {
    return false;
  }
  return true;
});

Cypress.Commands.add('clearAuth', () => {
  cy.window()
    .then((win) => {
      win.localStorage.removeItem('rpg-auth-token');
      win.localStorage.removeItem('rpg-user-data');
    });
});

Cypress.Commands.add('ensureAuth', () => {
  cy.window()
    .then((win) => {
    // Create a valid JWT-like token with a far-future expiration for E2E tests
    // This is a mock token that will pass client-side validation
    // Format: header.payload.signature (base64url encoded)
      const header = btoa(JSON.stringify({
        alg: 'HS256',
        typ: 'JWT',
      }));
      // Set expiration to year 2100 (4102444800 seconds since epoch)
      const payload = btoa(JSON.stringify({
        sub: 'e2e-test-user',
        exp: 4102444800,
      }));
      const signature = 'e2e-bypass-signature';
      const e2eToken = `${header}.${payload}.${signature}`;
      win.localStorage.setItem('rpg-auth-token', e2eToken);
    });

  // Stub the /api/auth/profile and /api/characters endpoints to avoid requiring a real backend
  cy.intercept('GET', '/api/auth/profile', {
    statusCode: 200,
    body: {
      name: 'Test User',
      email: 'test@example.com',
      picture: 'http://localhost/avatar.png',
    },
  })
    .as('getProfile');

  // Fetch profile and set local storage using the stubbed response
  cy.request({
    url: '/api/auth/profile',
    failOnStatusCode: false,
  })
    .then((resp) => {
      if (resp?.status === 200 && resp?.body) {
        cy.window()
          .then((win) => {
            win.localStorage.setItem('rpg-user-data', JSON.stringify(resp.body));
          });
        return;
      }

      throw new Error('ensureAuth failed: /api/auth/profile did not return a profile. Ensure backend is up or provide a mock.');
    });
});

// Helper wrappers exposing the node tasks for DB prep/cleanup
Cypress.Commands.add('prepareE2EDb', (opts?: {
  count?: number;
  url?: string;
  ready?: boolean;
  withChat?: boolean;
}) => cy.task('prepareE2EDb', opts || { count: 2 }));

Cypress.Commands.add('cleanupE2EDb', (opts?: { url?: string }) => cy.task('cleanupE2EDb', opts || {}));
