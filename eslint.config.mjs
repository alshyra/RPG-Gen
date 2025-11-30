import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import globals from 'globals';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  { ignores: ['dist/**', 'node_modules/**'] },
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
    },
  },
  // TypeScript files (generic)
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: { ...ts.parser },
      parserOptions: {
        tsconfigRootDir,
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
  // Backend-specific override (TS project)
  {
    files: ['packages/backend/**/*.{ts,js}'],
    languageOptions: {
      parser: { ...ts.parser },
      parserOptions: {
        tsconfigRootDir,
        project: ['./packages/backend/tsconfig.json'],
      },
    },
    rules: {},
  },
  // Frontend-specific override (TS + Vue)
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['packages/frontend/**/*.{ts,tsx,js,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        // Use the TypeScript parser for script blocks but avoid `project` here
        // so ESLint won't attempt typed linting across the whole repo.
        parser: ts.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir,
        project: ['./packages/frontend/tsconfig.eslint.json'],
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
      '@stylistic/newline-per-chained-call': ['error'],
    },
  },
  // Tests & Cypress relaxations
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'cypress/**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
