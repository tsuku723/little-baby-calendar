module.exports = {
  preset: 'jest-expo',
  testMatch: ["**/__tests__/**/*.jest.test.(ts|tsx|js|jsx)"],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/legacy/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
