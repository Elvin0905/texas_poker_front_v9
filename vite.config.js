const { defineConfig } = require("vite");

module.exports = defineConfig({
  // Use relative paths so static hosting subpaths work in more environments.
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
  },
});
