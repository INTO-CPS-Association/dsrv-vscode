const { defineConfig } = require("@vscode/test-cli");

module.exports = defineConfig([
  {
    label: "integrationTests",
    files: "dist/**/*.integration.test.js",
    version: "stable",
    launchArgs: ["--disable-gpu"],
    mocha: {
      ui: "tdd",
      timeout: 20000,
    },
  },
]);
