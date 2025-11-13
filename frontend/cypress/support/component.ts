// ***********************************************
// This file is used for component testing support
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************

import './commands';
import { mount } from 'cypress/vue';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);
