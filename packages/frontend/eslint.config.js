import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  { ignores: ['dist/**'] },
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
  // Global rules
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
      'arrow-body-style': ['warn', 'as-needed'],
      'no-restricted-syntax': ['warn', 'ForStatement', 'ForInStatement', 'ForOfStatement'],
      'max-statements': ['warn', 15],
      'prefer-object-spread': 'warn',
      '@stylistic/newline-per-chained-call': ['error'],
    },
  },
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}', '**/*.d.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: { ...ts.parser },
      parserOptions: {
        tsconfigRootDir,
        project: ['./tsconfig.eslint.json'],
      },
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
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@stylistic/array-bracket-newline': ['error', { minItems: 2 }],
      '@stylistic/array-element-newline': ['error', { minItems: 2 }],
    },
  },
  // Vue files
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        // Use the TypeScript parser for script blocks but avoid `project` here
        // so ESLint won't attempt typed linting that requires the file to be included in a tsconfig.
        parser: ts.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
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
    },
  },
  // CommonJS files
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Test and Cypress files
  {
    files: ['cypress.config.ts', 'cypress/**/*.{ts,tsx,js,jsx}', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
