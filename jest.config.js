module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/templates/**',
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Handle ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ora|cli-cursor|restore-cursor|onetime|mimic-fn|strip-ansi|ansi-regex|is-unicode-supported|is-fullwidth-code-point|emoji-regex|string-width|eastasianwidth|ansi-styles)/)',
  ],
  moduleNameMapper: {
    '#(.*)': '<rootDir>/node_modules/$1',
  },
}; 