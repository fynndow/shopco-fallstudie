module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js',
    '!src/config/**',
    '!src/db/testReset.js',
    '!src/**/*Routes.js',
    '!src/**/*Controller.js',
    '!src/middleware/errorHandler.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text-summary', 'json-summary', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 80
    }
  },
  testTimeout: 15000,
  verbose: false
};
