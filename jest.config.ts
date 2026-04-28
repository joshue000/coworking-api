import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@application/(.*)$": "<rootDir>/src/application/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/main.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  globalSetup: "./tests/setup.ts",
  globalTeardown: "./tests/teardown.ts",
};

export default config;
