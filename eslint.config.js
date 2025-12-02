import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import globals from 'globals';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

// Stylistic rules matching Prettier behavior
const stylisticRules = {
  '@stylistic/array-bracket-newline': ['error', { multiline: true }],
  '@stylistic/array-element-newline': ['error', 'consistent'],
  '@stylistic/object-curly-newline': ['error', {
    ObjectExpression: { multiline: true, minProperties: 2, consistent: true },
    ObjectPattern: { multiline: true, minProperties: 2, consistent: true },
    ImportDeclaration: { multiline: true, minProperties: 4, consistent: true },
  }],
  '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: false }],
  '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
  '@stylistic/function-call-argument-newline': ['error', 'consistent'],
  '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 1 }],
  '@stylistic/implicit-arrow-linebreak': ['error', 'beside'],
};

// Shared rules for both frontend and backend
const sharedRules = {
  'no-unused-vars': 'off',
  'prefer-destructuring': 'off',
  '@typescript-eslint/prefer-destructuring': 'error',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true, destructuredArrayIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-unnecessary-type-arguments': 'error',
  '@typescript-eslint/no-redundant-type-constituents': 'error',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  'no-console': 'off',
  'arrow-body-style': ['error', 'as-needed'],
  'no-restricted-syntax': ['error', 'ForStatement', 'ForInStatement', 'ForOfStatement'],
  'max-statements': ['error', 15, { ignoreTopLevelFunctions: true }],
  'prefer-object-spread': 'error',
  ...stylisticRules,
};

export default defineConfig([
  { ignores: ['**/dist/**', '**/node_modules/**', 'packages/shared/src/openapi.json'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    jsx: false,
    braceStyle: '1tbs',
    commaDangle: 'always-multiline',
    quoteProps: 'consistent-as-needed',
  }),
  // CommonJS config files (postcss, tailwind)
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node, module: 'readonly', require: 'readonly' },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  // Backend TypeScript files
  {
    files: ['packages/backend/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir },
      globals: {
        console: 'readonly', process: 'readonly', Buffer: 'readonly',
        setTimeout: 'readonly', setInterval: 'readonly',
        clearTimeout: 'readonly', clearInterval: 'readonly',
      },
    },
    rules: sharedRules,
  },
  ...pluginVue.configs['flat/recommended'],
  // Frontend TypeScript + Vue files
  {
    files: ['packages/frontend/**/*.{ts,tsx,vue}'],
    ignores: [
      'packages/frontend/*.config.ts',
      'packages/frontend/test/setup.ts',
    ],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser, ecmaVersion: 'latest', sourceType: 'module',
        projectService: true, tsconfigRootDir, extraFileExtensions: ['.vue'],
      },
      globals: { ...globals.browser },
    },
    rules: {
      ...sharedRules,
      'vue/multi-word-component-names': 'error',
      'vue/block-order': 'error',
      'vue/max-attributes-per-line': ['error', { singleline: 1, multiline: 1 }],
      'vue/first-attribute-linebreak': ['error', { singleline: 'ignore', multiline: 'below' }],
    },
  },
  // Frontend config files (vitest, cypress, etc.) - simple JS linting, no type-aware rules
  {
    files: [
      'packages/frontend/vite.config.ts',
      'packages/frontend/vitest.config.ts',
      'packages/frontend/cypress.config.ts',
      'packages/frontend/test/setup.ts',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      globals: { ...globals.node },
    },
    rules: {
      ...sharedRules,
      '@typescript-eslint/no-require-imports': 'off',
      // Disable type-aware rules that require parserOptions.project
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
    },
  },
  // Tests & Cypress relaxations
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/cypress/**/*.{ts,tsx,js,jsx}', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'max-statements': 'off',
    },
  },
  // Scripts (.mjs files)
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest', sourceType: 'module',
      globals: { ...globals.node, fetch: 'readonly' },
    },
    rules: { '@typescript-eslint/no-unused-vars': 'off', 'no-restricted-syntax': 'off', 'max-statements': 'off' },
  },
]);
