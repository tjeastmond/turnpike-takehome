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
├── saves/            # created on first Save when dev/preview server handles POST /__tax-save
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
- `**vite.config.js**`: Vite config (React plugin), dev server port **4000**, Vitest settings (`globals: true`, `environment: 'jsdom'`), and the **`tax-calculator-save`** plugin that handles **`POST /__tax-save`** during **`pnpm dev`** and **`pnpm preview`** only (writes JSON files under `./saves`).
- `**tsconfig.json`**: TypeScript compiler options (`strict`, `jsx: react-jsx`, `include: ["src"]`).
- `**tailwind.config.js**`: Tailwind content scanning for `index.html` and `src/**/*.{js,ts,jsx,tsx}`.
- `**postcss.config.js**`: PostCSS plugin config (Tailwind + Autoprefixer).

### `scripts/`

- `**scripts/create_duckdb_table.sql**`: Standalone SQL helper; not wired into the web app.

### `src/`

- `**src/main.tsx**`: React entrypoint; creates the root and renders `TaxCalculator` inside `StrictMode`.
- `**src/TaxCalculator.tsx**`: Main application UI and tax calculation logic (inputs, localStorage persistence, **Save** + export/import, toast notifications).
- `**src/index.css**`: Tailwind directives (`@tailwind base/components/utilities`).
- `**src/vite-env.d.ts**`: Vite client types reference.

## `pnpm` scripts

Run these from the repo root.

- `**pnpm dev**`: Start Vite dev server (configured to use port **4000**).
- `**pnpm build`**: Build the production bundle.
- `**pnpm preview**`: Serve the production build locally for preview.
- `**pnpm typecheck**`: Run `tsc -p tsconfig.json --noEmit`.
- `**pnpm test**`: Run tests with Vitest.
- `**pnpm test:ui**`: Launch Vitest UI runner.
- `**pnpm test:coverage**`: Run tests and generate coverage.

## Saving and persistence

### Automatic browser storage

- Form state is written to **`localStorage`** under the key **`taxCalculatorData`** whenever inputs change (income, expenses, filing status, dependents, retirement, home office fields).
- **New** clears that key and resets the form after confirmation.

### Save button (snapshot JSON on disk)

- **Save** does two things: it **explicitly** re-writes **`taxCalculatorData`** to `localStorage` (same shape as the auto-save effect), and it sends a **`POST /__tax-save`** request with JSON body `{ filename, contents }`.
- **`contents`** is the same structured export as **Export → Export as JSON** (`metadata`, `inputs`, `calculations`), produced by **`stringifyTaxExportJson()`** in `TaxCalculator.tsx`.
- **`filename`** is **`001_tax-calculation-YYYY-MM-DD.json`** (date from ISO, same date pattern as the default export filename, with an `001_` prefix).
- When the Vite dev or preview server is running, the **`tax-calculator-save`** middleware creates **`./saves/`** if needed and writes the file there. Filenames are validated (basename only, `.json`, safe characters); payload size is capped (~2 MB).
- **Static hosting / `file://` / no server**: the POST fails; the app still keeps **`localStorage`** updated and shows a **warning** toast explaining that **`saves/`** is only available with **`pnpm dev`** or **`pnpm preview`**.

### Export vs Save

- **Export → Export as JSON** triggers a **browser download** with the default name **`tax-calculation-YYYY-MM-DD.json`** (no `001_` prefix, no `saves/` write).
- **Save** does **not** start a download; it targets **`saves/`** via the dev/preview server when available.

### Toasts

- Save, import success, new session, and save failures use a **fixed-position toast** at the bottom of the viewport (not inline in the header) so the toolbar layout does not shift when messages appear.

