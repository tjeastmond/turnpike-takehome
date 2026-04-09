# AGENTS.md

This document is a quick guide for AI agents and contributors to understand this repo’s structure and how to run it.

## Project overview

- **App**: Vite + React + **TypeScript** (strict) for a NJ 1099 tax calculator; UI and calculations live in a single component (`TaxCalculator.tsx`).
- **Icons**: [lucide-react](https://lucide.dev/).
- **Styling**: Tailwind CSS via PostCSS.
- **Testing**: Vitest is configured in `vite.config.js` with `jsdom`, `globals: true`, and **`passWithNoTests: true`**. There are no `*.test.`* / `*.spec.*` files in the repo yet.

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
- `**vite.config.js**`: Vite config (React plugin), dev server port **4000**, Vitest settings, and the **`tax-calculator-save`** plugin (dev + preview only). See **Dev/preview middleware** below.
- `**tsconfig.json`**: TypeScript compiler options (`strict`, `jsx: react-jsx`, `include: ["src"]`).
- `**tailwind.config.js**`: Tailwind content scanning for `index.html` and `src/**/*.{js,ts,jsx,tsx}`.
- `**postcss.config.js**`: PostCSS plugin config (Tailwind + Autoprefixer).

### `scripts/`

- `**scripts/create_duckdb_table.sql**`: Standalone SQL helper; not wired into the web app.

### `src/`

- `**src/main.tsx**`: React entrypoint; creates the root and renders `TaxCalculator` inside `StrictMode`.
- `**src/TaxCalculator.tsx**`: Main application UI and tax calculation logic (inputs, localStorage persistence, **Files** / **Save**, export/import, toast notifications).
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

### Dev/preview middleware (`tax-calculator-save` in `vite.config.js`)

- Only active during **`pnpm dev`** and **`pnpm preview`** (not in static production builds).
- **`POST /__tax-save`**: body `{ filename, contents }`. Writes **`./saves/`** if needed. Validates basename (`.json`, safe characters), payload size (~2 MB), and that **`contents`** is non-empty JSON with object **`inputs`** and **`calculations`** (rejects empty or malformed exports).
- **`GET /__tax-saves-list`**: returns the **10 most recently modified** `*.json` files in **`saves/`** (name + `mtimeMs`).
- **`GET /__tax-saves-read?filename=`**: returns raw file contents for one save (same basename rules as POST).
- **`GET /__tax-saves-next-index`**: returns **`{ nextIndex }`** for the next **`NNN_`** prefix (scans existing `NNN_*.json` files, max + 1).

### Save button (snapshot JSON on disk)

- **Save** re-writes **`taxCalculatorData`** to `localStorage`, then **`GET /__tax-saves-next-index`** and **`POST /__tax-save`** with **`{ filename, contents }`**.
- **`contents`** matches **Export → Export as JSON** (`metadata`, `inputs`, `calculations`) from **`stringifyTaxExportJson()`**.
- **`filename`** is **`NNN_tax-calculation-YYYY-MM-DD.json`** — **`NNN`** is three digits from the server (**`001_`**, **`002_`**, …), date is ISO **YYYY-MM-DD**.
- **Static hosting / `file://` / no server**: save/list/read requests fail; **`localStorage`** still updates; **warning** toasts explain **`saves/`** needs **`pnpm dev`** or **`pnpm preview`**.

### Files button (reload from `saves/`)

- Opens a menu listing the **last 10** files from **`GET /__tax-saves-list`**.
- Choosing a file **`GET`s** it as **text**, **`JSON.parse`**, validates export shape, then applies state with **`flushSync`** (same approach as **Import** from a JSON file).
- Toolbar uses a **higher z-index** so the dropdown sits above the form grid (click targets stay correct).

### Export vs Save

- **Export → Export as JSON** downloads **`tax-calculation-YYYY-MM-DD.json`** (no **`NNN_`** prefix, no **`saves/`** write).
- **Save** does not download; it writes under **`saves/`** when the dev/preview server is available.

### Toasts

- Save, import, Files load, new session, and failures use a **fixed-position toast** at the bottom of the viewport so the toolbar does not shift.

