module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.jest.test.{ts,tsx,js,jsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/legacy/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/models/dataModels.ts',
    '<rootDir>/src/navigation/types.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
