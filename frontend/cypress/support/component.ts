import { mount } from 'cypress/vue';

Cypress.Commands.add('mount', mount);

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}
