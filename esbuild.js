const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Dual-target build:
 *  1. Extension host → CommonJS, Node platform, excludes 'vscode'
 *  2. Webview UI     → IIFE, Browser platform, bundles React
 */
async function main() {
  // --- Extension Host Build ---
  const extCtx = await esbuild.context({
    entryPoints: ['src/extension/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'info',
    tsconfig: 'tsconfig.json',
  });

  // --- Webview UI Build ---
  const webCtx = await esbuild.context({
    entryPoints: ['src/webview/main.tsx'],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outdir: 'dist/webview',
    logLevel: 'info',
    tsconfig: 'tsconfig.json',
    jsx: 'automatic',
    loader: {
      '.svg': 'dataurl',
    },
  });

  if (watch) {
    await Promise.all([extCtx.watch(), webCtx.watch()]);
    console.log('[esbuild] Watching extension + webview for changes...');
  } else {
    await Promise.all([extCtx.rebuild(), webCtx.rebuild()]);
    await Promise.all([extCtx.dispose(), webCtx.dispose()]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
