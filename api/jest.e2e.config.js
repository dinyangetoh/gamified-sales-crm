/** @type {import('jest').Config} */
module.exports = {
  displayName: 'e2e',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      '<rootDir>/node_modules/ts-jest',
      { tsconfig: '<rootDir>/tsconfig.json' },
    ],
  },
  testEnvironment: 'node',
  testTimeout: 30000,
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@db$': '<rootDir>/generated/prisma/client',
    '^@prisma/client$': '<rootDir>/generated/prisma/client',
  },
}
