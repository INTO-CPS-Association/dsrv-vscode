const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");
const minify = process.argv.includes("--minify");
const sourcemap = process.argv.includes("--sourcemap");

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[build] started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`,
        );
      });
      console.log("[build] finished");
    });
  },
};

async function main() {
  const extensionctx = await esbuild.context({
    entryPoints: ["extension.ts"],
    bundle: true,
    format: "cjs",
    minify: minify,
    sourcemap: sourcemap,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });

  const testsCtx = await esbuild.context({
    entryPoints: ["client/src/logger.integration.test.ts"],
    bundle: true,
    format: "cjs",
    minify: minify,
    sourcemap: sourcemap,
    sourcesContent: false,
    platform: "node",
    outdir: "dist",
    outbase: ".",
    external: ["vscode", "mocha", "assert"],
    logLevel: "silent",
    plugins: [esbuildProblemMatcherPlugin],
  });

  if (watch) {
    await Promise.all([extensionctx.watch(), testsCtx.watch()]);
  } else {
    await Promise.all([extensionctx.rebuild(), testsCtx.rebuild()]);
    await Promise.all([extensionctx.dispose(), testsCtx.dispose()]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
