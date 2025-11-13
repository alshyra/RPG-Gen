const js = require('@eslint/js');
const ts = require('typescript-eslint');

module.exports = [
  {
    ignores: ['dist', 'node_modules', '*.config.js', 'test/**']
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: ts.parser,
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'off',
      'arrow-body-style': ['warn', 'as-needed'],
      'no-restricted-syntax': ['warn', 'ForStatement', 'ForInStatement', 'ForOfStatement'],
      'max-statements': ['warn', 10],
      'prefer-object-spread': 'warn'
    }
  }
];
