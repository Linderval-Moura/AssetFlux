/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "../coverage",
  coverageProvider: "v8",
  testEnvironment: "node",
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "**/*.(t|j)s"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "app.module.ts",
    "main.ts",
    "providers.module.ts",
    "providers.mock.module.ts",
    "auth.module.ts",
    "users.module.ts",
    "images.module.ts",
    "dto/",
    "interfaces/",
  ],
  moduleFileExtensions: [
    "js",
    "json",
    "ts"
  ],
};