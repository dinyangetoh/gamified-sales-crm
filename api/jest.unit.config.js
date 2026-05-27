/** @type {import('jest').Config} */
module.exports = {
  displayName: 'unit',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      '<rootDir>/node_modules/ts-jest',
      { tsconfig: '<rootDir>/tsconfig.json' },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts', '!**/*.module.ts', '!**/index.ts'],
  coverageDirectory: 'coverage/unit',
  coverageThreshold: {
    global: { statements: 70, branches: 65, lines: 70 },
  },
  testEnvironment: 'node',
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@db$': '<rootDir>/generated/prisma/client',
    '^@db/(.*)$': '<rootDir>/generated/prisma/$1',
    '^@prisma/client$': '<rootDir>/generated/prisma/client',
  },
}
