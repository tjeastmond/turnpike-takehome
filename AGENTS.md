# AGENTS.md

This document is a quick guide for AI agents and contributors to understand this repo’s structure and how to run it.

## Project overview

- **App**: Vite + React + **TypeScript** (strict) for a NJ 1099 tax calculator; UI and calculations live in a single component (`TaxCalculator.tsx`).
- **Icons**: [lucide-react](https://lucide.dev/).
- **Styling**: Tailwind CSS via PostCSS.
- **Testing**: Vitest is configured in `vite.config.js` with `jsdom` and `globals: true`. There are no `*.test.`* / `*.spec.*` files in the repo yet.

## Directory structure (high level)

```text
.
├── scripts/          # ancillary SQL (not used by the Vite app at runtime)
├── src/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.js
```

## Key files and what they do

### Root

- `**package.json**`: Node package manifest; defines `pnpm` scripts and dependencies.
- `**pnpm-lock.yaml**`: Lockfile for reproducible installs.
- `**index.html**`: Vite entry HTML; mounts React at `#root` and loads `src/main.tsx`.
- `**vite.config.js**`: Vite config (React plugin), dev server port **3000**, and Vitest settings (`globals: true`, `environment: 'jsdom'`).
- `**tsconfig.json`**: TypeScript compiler options (`strict`, `jsx: react-jsx`, `include: ["src"]`).
- `**tailwind.config.js**`: Tailwind content scanning for `index.html` and `src/**/*.{js,ts,jsx,tsx}`.
- `**postcss.config.js**`: PostCSS plugin config (Tailwind + Autoprefixer).

### `scripts/`

- `**scripts/create_duckdb_table.sql**`: Standalone SQL helper; not wired into the web app.

### `src/`

- `**src/main.tsx**`: React entrypoint; creates the root and renders `TaxCalculator` inside `StrictMode`.
- `**src/TaxCalculator.tsx**`: Main application UI and tax calculation logic (inputs, localStorage persistence, CSV/JSON/TXT export, import).
- `**src/index.css**`: Tailwind directives (`@tailwind base/components/utilities`).
- `**src/vite-env.d.ts**`: Vite client types reference.

## `pnpm` scripts

Run these from the repo root.

- `**pnpm dev**`: Start Vite dev server (configured to use port **3000**).
- `**pnpm build`**: Build the production bundle.
- `**pnpm preview**`: Serve the production build locally for preview.
- `**pnpm typecheck**`: Run `tsc -p tsconfig.json --noEmit`.
- `**pnpm test**`: Run tests with Vitest.
- `**pnpm test:ui**`: Launch Vitest UI runner.
- `**pnpm test:coverage**`: Run tests and generate coverage.

