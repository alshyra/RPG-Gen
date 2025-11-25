import js from '@eslint/js';
import ts from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default [
  { ignores: ['dist', 'node_modules', '.vite', 'coverage', '*.config.js', '*.config.cjs', 'cypress/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    jsx: false,
    braceStyle: '1tbs',
    commaDangle: 'always-multiline',
    quoteProps: 'consistent-as-needed',
  }),
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: { ...ts.parser },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'off',
      'arrow-body-style': ['warn', 'as-needed'],
      'no-restricted-syntax': ['warn', 'ForStatement', 'ForInStatement', 'ForOfStatement'],
      'max-statements': ['warn', 15],
      'prefer-object-spread': 'warn',
      '@stylistic/array-bracket-newline': ['error', { 'minItems': 2 }]
    },
  },
];
