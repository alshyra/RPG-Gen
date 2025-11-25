import shared from '../../eslint.shared.js';
import vueParser from 'vue-eslint-parser';
import pluginVue from 'eslint-plugin-vue'
import ts from 'typescript-eslint';
import globals from 'globals';

export default [
  ...pluginVue.configs['flat/recommended'],
  ...shared,
  // Allow `any` in tests to reduce friction when mocking behavior
  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
    {
      files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
      ...globals.browser
      }
    },
    rules: {
      'vue/multi-word-component-names': 'error',
      'vue/block-order': 'error',
      'vue/max-attributes-per-line': ['error', { singleline: 1, multiline: 1 }],
      'vue/first-attribute-linebreak': ['error', { singleline: 'ignore', multiline: 'below' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'arrow-body-style': ['error', 'as-needed'],
      'no-restricted-syntax': ['error', 'ForStatement', 'ForInStatement', 'ForOfStatement'],
      'max-statements': ['error', 15],
      'prefer-object-spread': 'error',
    }
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    },
  },
];
