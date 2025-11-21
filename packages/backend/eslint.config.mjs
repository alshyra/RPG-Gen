import shared from '../../eslint.shared.js';
import ts from 'typescript-eslint';

export default [
  ...shared,
  // Backend-specific override: set tsconfigRootDir for TypeScript parser resolution
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: { ...ts.parser, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // backend can customize stricter rules if necessary
    },
  },
];
