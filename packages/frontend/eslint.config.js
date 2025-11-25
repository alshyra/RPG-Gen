/* global URL */
import shared from '../../eslint.shared.js';
import vueParser from 'vue-eslint-parser';
import pluginVue from 'eslint-plugin-vue';
import ts from 'typescript-eslint';
import globals from 'globals';

export default [
  ...pluginVue.configs['flat/recommended'],
  ...shared,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'error',
      'vue/block-order': 'error',
      'vue/max-attributes-per-line': ['error', { singleline: 1, multiline: 1 }],
      'vue/first-attribute-linebreak': ['error', { singleline: 'ignore', multiline: 'below' }],
      'arrow-body-style': ['error', 'as-needed'],
      'no-restricted-syntax': ['error', 'ForStatement', 'ForInStatement', 'ForOfStatement'],
      'max-statements': ['error', 15],
      'prefer-object-spread': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['cypress.config.ts', 'cypress/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: { ...ts.parser },
      parserOptions: {
        // set the tsconfig root to this package so type-aware rules can find type information
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        // include the main tsconfig and the node tsconfig for tools like ts-node (Cypress)
        project: ['./tsconfig.eslint.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // disable the unnecessary-type-assertion rule for Cypress files if desired
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },
  {
    // Ensure TypeScript project is available for all TS files so typed rules can run
    files: ['**/*.{ts,tsx}', '**/*.d.ts'],
    languageOptions: {
      parser: { ...ts.parser },
      parserOptions: {
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        project: ['./tsconfig.eslint.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
];
