const { defineConfig } = require("@vscode/test-cli");

module.exports = defineConfig([
  {
    label: "integrationTests",
    files: "dist/**/*.integration.test.js",
    version: "stable",
    // Remove --disable-gpu to use hardware acceleration if available
    // Add --info to see more detailed logs in the terminal
    launchArgs: [
      "--info"
    ],
    mocha: {
      ui: "tdd",
      timeout: 60000, // Increased to 60s to give you time to look at the window
      reporter: "spec", // Provides a more readable step-by-step output in terminal
    },
  },
]);
