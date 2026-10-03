import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Standard-tier app. Two ways to run it, and both have to keep working:
 *
 *   1. Standalone at http://localhost:5174 — its own origin, its own sign-in.
 *   2. Federated into the shell, which loads `assets/remoteEntry.js` from here
 *      and mounts `./SpendExplorer` in place.
 *
 * ADR-2 makes (1) non-optional: the shell is on the critical path of every
 * tenant's UX, so a tenant must be able to route around it during an incident.
 * Federation is additive here — `main.tsx` is untouched by it.
 */
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'finance_spend_explorer',
      filename: 'remoteEntry.js',
      exposes: {
        // The one thing the shell is allowed to mount. The app's sign-in,
        // routing and page chrome are deliberately NOT exposed — in the shell
        // those belong to the shell.
        './SpendExplorer': './src/SpendExplorer.tsx',
      },
      /*
       * Sharing, not optimising. Two copies of React in one realm means a hook
       * in this remote resolves against a dispatcher the host's copy never
       * set, and every hook here throws. Both builds still succeed in that
       * state, which is what makes it worth spelling out.
       *
       * Note that `@originjs/vite-plugin-federation` does NOT implement
       * webpack's `singleton` flag — it is commented out in the plugin's types
       * and absent from its runtime. Listing a module here makes this build
       * resolve it through `importShared()`, which checks the host's share
       * scope first and only falls back to the copy bundled alongside this
       * remote if nothing there satisfies `requiredVersion`.
       *
       * So the range below is load-bearing in a way a version range usually is
       * not: widen it and a mismatched host React gets used anyway; narrow it
       * past the host's version and this remote silently loads a second React
       * and breaks. It is the frontend half of the version coupling ADR-2
       * accepted knowingly, and the shell verifies the outcome at runtime
       * rather than trusting it.
       */
      shared: {
        react: { requiredVersion: '^18.3.1' },
        'react-dom': { requiredVersion: '^18.3.1' },
      },
    }),
  ],
  server: {
    port: 5174,
  },
  preview: {
    port: 5174,
  },
  resolve: {
    /*
     * The ui-kit is installed from a local path, so resolving through its
     * symlink can reach the copy of React in *its* node_modules as well as the
     * app's. Two Reacts means hooks throw at runtime — and the build still
     * succeeds, so nothing catches it until the page is blank. Keep this.
     */
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: ['@insights-platform/ui-kit'],
  },
  build: {
    // vite-plugin-federation emits top-level await in the remote entry.
    target: 'esnext',
    // Minification mangles the plugin's generated `__federation__` exports on
    // some rollup versions; a remote entry is small enough not to care.
    minify: false,
  },
});
