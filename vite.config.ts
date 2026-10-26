import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({command}) => {
  const isDev = command === 'serve';
  // Repository name for GitHub Pages (https://mcpvip1.github.io/HPT-ESP/)
  const repoName = process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/HPT-ESP/';
  const base = isDev ? '/' : (process.env.VITE_BASE || repoName);

  // Release identity: release.json is the single source of truth for the
  // displayed version number (V2.1.4 style) and its change log. Bump
  // `version` (and the highlights) on every release push; the bundle hash
  // in version.json still catches unbumped rebuilds for update prompts.
  let release: { version?: unknown; highlights?: unknown } = {};
  try {
    release = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'release.json'), 'utf-8'));
  } catch {
    console.warn('[release] release.json missing or invalid — falling back to V0.0.0');
  }
  const releaseVersion = typeof release.version === 'string' && release.version ? release.version : 'V0.0.0';
  const releaseHighlights =
    release.highlights && typeof release.highlights === 'object' ? release.highlights : {};

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(releaseVersion),
      __APP_BUILT_AT__: JSON.stringify(new Date().toISOString()),
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'copy-404-for-github-pages',
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist');
          const indexPath = path.join(distDir, 'index.html');
          const notFoundPath = path.join(distDir, '404.html');
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, notFoundPath);
          }
        },
      },
      {
        // Writes dist/version.json so the app can tell a real new deploy
        // apart from the bundle it is currently running (see versionManager).
        // Carries the release version + change log from release.json.
        // Never fails the build: without version.json the app simply shows
        // no update prompt instead of a fake one.
        name: 'write-version-json',
        closeBundle() {
          try {
            const distDir = path.resolve(__dirname, 'dist');
            const indexPath = path.join(distDir, 'index.html');
            if (!fs.existsSync(indexPath)) return;
            const html = fs.readFileSync(indexPath, 'utf-8');
            const match = html.match(/\/assets\/(index-([A-Za-z0-9_-]+)\.js)/);
            if (!match) {
              console.warn('[write-version-json] no hashed bundle found in index.html');
              return;
            }
            const [, js, hash] = match;
            fs.writeFileSync(
              path.join(distDir, 'version.json'),
              JSON.stringify(
                {
                  js,
                  hash,
                  builtAt: new Date().toISOString(),
                  version: releaseVersion,
                  highlights: releaseHighlights,
                },
                null,
                2
              )
            );
          } catch (err) {
            console.warn('[write-version-json] failed:', err);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
