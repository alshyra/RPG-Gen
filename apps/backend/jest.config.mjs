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
  
  // Only ignore node_modules and dist
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  
  // Module resolution for ESM and path aliases
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Strip .js extension first, then apply path mapping
    '^#shared$': '<rootDir>/src/shared/domain/index.ts',
    '^#shared/(.*)\\.js$': '<rootDir>/src/shared/domain/$1.ts',
    '^#shared/(.*)$': '<rootDir>/src/shared/domain/$1',
    '^#character/(.*)\\.js$': '<rootDir>/src/bounded-contexts/character/$1.ts',
    '^#character/(.*)$': '<rootDir>/src/bounded-contexts/character/$1',
    '^#archetype/(.*)\\.js$': '<rootDir>/src/bounded-contexts/archetype/$1.ts',
    '^#archetype/(.*)$': '<rootDir>/src/bounded-contexts/archetype/$1',
    '^#combat/(.*)\\.js$': '<rootDir>/src/bounded-contexts/combat/$1.ts',
    '^#combat/(.*)$': '<rootDir>/src/bounded-contexts/combat/$1',
    '^#game-data$': '<rootDir>/src/bounded-contexts/game-data/index.ts',
    '^#workflows$': '<rootDir>/src/workflows/index.ts',
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
