/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  
  // Enable parallel test execution for better IDE support and speed
  maxWorkers: '50%',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/src/bounded-contexts/**/tests/*.test.ts',
  ],
  
  // Ignore integration tests for now (they need special setup)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '<rootDir>/test/integration/',
  ],
  
  // Module resolution for ESM and path aliases
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^#shared$': '<rootDir>/src/shared/domain/index.js',
    '^#shared/(.*)$': '<rootDir>/src/shared/domain/$1',
    '^#character/(.*)$': '<rootDir>/src/bounded-contexts/character/$1',
    '^#archetype/(.*)$': '<rootDir>/src/bounded-contexts/archetype/$1',
    '^#combat/(.*)$': '<rootDir>/src/bounded-contexts/combat/$1',
    '^#game-data$': '<rootDir>/src/bounded-contexts/game-data/index.js',
    '^#workflows$': '<rootDir>/src/workflows/index.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Transform configuration for ts-jest with ESM
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/tests/**',
  ],
  
  // Setup and teardown
  setupFilesAfterEnv: [],
  
  // Fail fast on first failure (like AVA)
  bail: 1,
  
  // Verbose output for debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
