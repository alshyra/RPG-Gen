/* eslint-env node */
/* eslint-disable no-undef, no-redeclare */
import shared from '../../eslint.shared.js';
import ts from 'typescript-eslint';

const dirname = new URL('.', import.meta.url).pathname;

export default [
  ...shared,
  // Backend-specific override: set tsconfigRootDir for TypeScript parser resolution
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: { ...ts.parser, tsconfigRootDir: dirname },
    },
    rules: {
      // backend can customize stricter rules if necessary
    },
  },
];
