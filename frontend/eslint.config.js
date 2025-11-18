import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import stylistic from '@stylistic/eslint-plugin';

export default [
  {
    ignores: ['dist', 'node_modules', '.vite', 'coverage', '*.config.js', '*.config.cjs', 'cypress/**']
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    jsx: false,
    braceStyle: '1tbs',
    commaDangle: 'always-multiline',
  }),
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: ts.parser,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        crypto: 'readonly',
        localStorage: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly'
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
      'max-statements': ['error', 10],
      'prefer-object-spread': 'error',
    }
  },
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: ts.parser,
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        crypto: 'readonly',
        localStorage: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'arrow-body-style': ['error', 'as-needed'],
      'no-restricted-syntax': ['error', 'ForStatement', 'ForInStatement', 'ForOfStatement'],
      'max-statements': ['error', 10],
      'prefer-object-spread': 'error',
    }
  }
];
