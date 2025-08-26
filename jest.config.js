module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'scripts/**/*.js',
    '.eleventy.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.config.js'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000
};