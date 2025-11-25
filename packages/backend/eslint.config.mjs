import shared from '../../eslint.shared.js';
import ts from 'typescript-eslint';

export default [
  ...shared,
  // Backend-specific override: set tsconfigRootDir for TypeScript parser resolution
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: { ...ts.parser, tsconfigRootDir: import.meta.dirname },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@stylistic/array-bracket-newline': ['error', { minItems: 2 }],
      // backend can customize stricter rules if necessary
    },
  },
];
