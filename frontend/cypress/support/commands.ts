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
    }
  }
}

// Custom command to select elements by data-cy attribute
Cypress.Commands.add('dataCy', (value: string) => cy.get(`[data-cy="${value}"]`));

export {};
