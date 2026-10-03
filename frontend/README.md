# Spend Explorer — frontend

A standard-tier app for tenant `finance`. It runs two ways, and **both have to
keep working**:

1. **Standalone** at <http://localhost:5174> — its own origin, its own sign-in.
2. **Federated** into the Insights Hub shell, which loads
   `assets/remoteEntry.js` from here and mounts `./SpendExplorer` in place.

Federation is additive. `main.tsx` and `App.tsx` know nothing about it, and
ADR-2 makes standalone non-optional: the shell is on the critical path of every
tenant's UX, so a tenant has to be able to route around it during an incident.

```bash
npm run dev      # standalone, hot reload, :5174
npm run serve    # build + preview on :5174 — what the shell needs
```

The shell can only consume a **built** remote. Vite's dev server does not emit a
remote entry, so `npm run dev` serves the app but not the federation surface.

## What is exposed

One module, `./SpendExplorer`, and its props are the whole host↔remote contract:

```ts
{ token: string | null; tenantId: string; subject: string }
```

The shell owns the session; this app receives it. The exposed component renders
page content only — no header, no sign-in, no routing. Standalone mode wraps it
in an `AppShell`; the shell supplies its own. A remote that draws its own chrome
produces two headers the moment it is mounted.

Keep the contract this small. Callbacks into shell routing or a shared store
would turn the independent-deploy property ADR-1 bought into a distributed
monolith.

## React

`shared: { react: { requiredVersion: '^18.3.1' } }` — and note there is no
`singleton: true`, because `@originjs/vite-plugin-federation` does not implement
it. Listing a module under `shared` makes this build resolve it through
`importShared()`, which checks the host's share scope first and falls back to
the copy bundled here only if nothing there matches the range.

So the range is load-bearing in a way a version range usually is not. Widen it
and a mismatched host React gets used anyway; narrow it past the host's version
and this remote quietly loads a second React and every hook in it throws —
with both builds still green. `src/platform/reactIdentity.ts` announces this
module's React to the shell so the shell can show the real instance count at
runtime. It is duplicated from the shell deliberately: a diagnostic that depends
on the shared package cannot diagnose a problem with the shared package.

## Deliberately thin

- **No backend.** `SpendExplorer` renders fixed rows. A real standard-tier app
  calls `useInsights` against its own `/api/insights`, exactly as
  `insights-platform/templates/web/frontend` does. This repo exists to be the
  thinnest possible federation remote.
- **`public/health`** is a static document rather than a real `/health` route,
  for the same reason. It satisfies the shell's registry contract so the
  health path can be exercised end to end.
- **No CSS of its own.** Everything comes from the ui-kit. That is not just
  tidiness: the federation plugin does not load an exposed module's stylesheet,
  so a remote with its own styles renders unstyled inside the shell. Using the
  kit means the host's single copy of `styles.css` already covers it.
