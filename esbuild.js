const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Triple-target build:
 *  1. Extension host → CommonJS, Node platform, excludes 'vscode'
 *  2. Sidebar webview → IIFE, Browser platform, bundles React
 *  3. Editor panel webview → IIFE, Browser platform, bundles React
 */
async function main() {
  const commonWeb = {
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    logLevel: 'info',
    tsconfig: 'tsconfig.json',
    jsx: 'automatic',
    loader: { '.svg': 'dataurl' },
  };

  // --- Extension Host ---
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
    mainFields: ['module', 'main'],
    logLevel: 'info',
    tsconfig: 'tsconfig.json',
  });

  // --- Sidebar Webview ---
  const sidebarCtx = await esbuild.context({
    ...commonWeb,
    entryPoints: ['src/webview/main.tsx'],
    outdir: 'dist/webview',
  });

  // --- Editor Panel Webview ---
  const editorCtx = await esbuild.context({
    ...commonWeb,
    entryPoints: ['src/webview-editor/editor.tsx'],
    outdir: 'dist/webview-editor',
  });

  if (watch) {
    await Promise.all([extCtx.watch(), sidebarCtx.watch(), editorCtx.watch()]);
    console.log('[esbuild] Watching extension + sidebar + editor for changes...');
  } else {
    await Promise.all([extCtx.rebuild(), sidebarCtx.rebuild(), editorCtx.rebuild()]);
    await Promise.all([extCtx.dispose(), sidebarCtx.dispose(), editorCtx.dispose()]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
