/// <reference types="cypress" />

// ***********************************************
// This file contains custom commands for Cypress
//
// For more examples of custom commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select an element by data-cy attribute.
       * @example cy.dataCy('submit-button')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Ensure the client is authenticated for a test run by contacting the real
       * backend's /api/auth/profile and storing a session token/profile locally.
       * This will fail if the backend isn't available or the profile endpoint
       * doesn't return a 200 response.
       */
      ensureAuth(): Chainable<void>;

      /**
       * Clear authentication tokens from localStorage
       * @example cy.clearAuth()
       */
      clearAuth(): Chainable<void>;

      /**
       * Prepare the E2E DB using the node script (creates characters).
       * @param opts.count number of characters to create
       * @param opts.url optional API url
       */
      prepareE2EDb(opts?: {
        count?: number;
        url?: string;
      }): Chainable<{
        ok: boolean;
        output?: string;
        error?: string;
      }>;

      /**
       * Cleanup the E2E DB (remove characters created for tests)
       */
      cleanupE2EDb(opts?: { url?: string }): Chainable<{
        ok: boolean;
        output?: string;
        error?: string;
      }>;

      // setupApiMocks is removed — tests should call real backend endpoints for E2E.
    }
  }
}
// Custom command to select elements by data-cy attribute
Cypress.Commands.add('dataCy', (value: string) => cy.get(`[data-cy="${value}"]`));

export {};
