# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

`reca-operateur` is currently an **unmodified Vite + React 19 + TypeScript scaffold** — `src/App.tsx` is still the generated starter page and `README.md` is the stock Vite template README. There is no application-specific code, no router, no state management, no backend calls, and no test setup yet. Treat any structure below as the starting point to build on, not as established architecture.

Note: the working directory is not a git repository.

## Commands

```bash
npm run dev      # Vite dev server with HMR
npm run build    # tsc -b (project references) then vite build → dist/
npm run lint     # eslint over the repo
npm run preview  # serve the built dist/ locally
```

There is no test runner installed. If tests are needed, add one (e.g. Vitest, which pairs with the existing Vite config) before writing tests.

## Toolchain specifics worth knowing

- **TypeScript is split into project references** (`tsconfig.json` → `tsconfig.app.json` for `src/`, `tsconfig.node.json` for Vite config files). Type errors surface via `npm run build` (`tsc -b`), not via `npm run lint` — the ESLint config uses `tseslint.configs.recommended`, which is *not* type-aware. Run the build to typecheck.
- `tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, and `erasableSyntaxOnly`. Consequences: unused imports/vars break the build; type-only imports must use `import type`; and TS-only runtime constructs (`enum`, parameter properties, namespaces) are rejected.
- **ESLint 10 flat config** (`eslint.config.js`) with `reactRefresh.configs.vite` — a module exporting a component must not also export non-component values, or Fast Refresh lint rules will fire.
- `public/` is served at the site root and is referenced by absolute URL from JSX (e.g. `<use href="/icons.svg#github-icon">`); assets imported from `src/assets/` go through Vite's bundler instead.
