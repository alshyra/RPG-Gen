// ***********************************************************
// This file is processed and loaded automatically before your e2e test files.
//
// You can change the location of this file or turn off loading
// support files with the 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Prevent uncaught exceptions from failing tests (like network errors to backend)
Cypress.on('uncaught:exception', (err) => {
  // Ignore network errors and Google OAuth redirect errors during tests
  if (err.message.includes('Network') || err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
    return false;
  }
  // Let other errors fail the test
  return true;
});

// Set up authentication mocking utilities
Cypress.Commands.add('mockAuth', () => {
  const mockToken = 'test-jwt-token-cypress-mock';
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    picture: 'https://via.placeholder.com/150'
  };
  
  localStorage.setItem('rpg-auth-token', mockToken);
  localStorage.setItem('rpg-user-data', JSON.stringify(mockUser));
});

Cypress.Commands.add('clearAuth', () => {
  localStorage.removeItem('rpg-auth-token');
  localStorage.removeItem('rpg-user-data');
});

// Helper to setup API mocks - call this in beforeEach of each test
Cypress.Commands.add('setupApiMocks', () => {
  // Intercept backend API calls and return quick mock responses
  cy.intercept('GET', '**/api/auth/profile', { 
    statusCode: 200, 
    body: { id: 'test', email: 'test@example.com', displayName: 'Test User' }
  });
  cy.intercept('GET', '**/api/characters', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/chat/history/**', { statusCode: 200, body: [] });
  cy.intercept('POST', '**/api/**', { statusCode: 200, body: { success: true } });
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
