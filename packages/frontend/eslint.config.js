import shared from '../../eslint.shared.js';
import ts from 'typescript-eslint';

export default [
  ...shared,
    {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: { ...ts.parser, tsconfigRootDir: import.meta.dirname },
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
];
