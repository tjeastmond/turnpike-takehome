# AGENTS.md

This document is a quick guide for AI agents and contributors to understand this repo’s structure and how to run it.

## Project overview

- **App**: Vite + React app for a NJ 1099 tax calculator (UI + calculations in a single component).
- **Styling**: Tailwind CSS via PostCSS.
- **Testing**: Vitest configured with `jsdom`.

## Directory structure (high level)

```text
.
├── docs/
├── scripts/
├── src/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── taxes.duckdb
```

## Key files and what they do

### Root

- **`package.json`**: Node package manifest; defines `pnpm` scripts and dependencies.
- **`pnpm-lock.yaml`**: Lockfile for reproducible installs.
- **`index.html`**: Vite entry HTML; mounts React at `#root` and loads `src/main.jsx`.
- **`vite.config.js`**: Vite config (React plugin), dev server port **3000**, and Vitest settings (`globals: true`, `environment: 'jsdom'`).
- **`tailwind.config.js`**: Tailwind content scanning for `index.html` and `src/**/*.{js,ts,jsx,tsx}`.
- **`postcss.config.js`**: PostCSS plugin config (Tailwind + Autoprefixer).
- **`taxes.duckdb`**: DuckDB database file (appears to be generated/used by scripts under `scripts/`).

### `src/`

- **`src/main.jsx`**: React entrypoint; creates the root and renders `TaxCalculator`.
- **`src/TaxCalculator.tsx`**: Main application UI and tax calculation logic (inputs, localStorage persistence, exports).
- **`src/index.css`**: Tailwind directives (`@tailwind base/components/utilities`).

### `scripts/`

- **`scripts/create_db.py`**: Reads `docs/stmt.csv`, parses transactions, and creates/replaces a `transactions` table in `taxes.duckdb`.
  - Note: this script depends on Python packages (`duckdb`, `pandas`) not managed by `package.json`.
- **`scripts/create_duckdb_table.sql`**: DuckDB SQL to create/replace `transactions` from `docs/stmt.csv` using `read_csv_auto(...)`.

### `docs/`

- **`docs/stmt.csv`**: Statement CSV input for the DuckDB scripts.
- **`docs/adp_last_pay_stub.pdf`**: Reference document (not used by the app runtime).

## `pnpm` scripts

Run these from the repo root.

- **`pnpm dev`**: Start Vite dev server (configured to use port **3000**).
- **`pnpm build`**: Build the production bundle.
- **`pnpm preview`**: Serve the production build locally for preview.
- **`pnpm db:create`**: Build `taxes.duckdb` by parsing `docs/stmt.csv` via `scripts/create_db.py` (requires Python deps like `duckdb` and `pandas`).
- **`pnpm db:create:sql`**: Build `taxes.duckdb` by running `scripts/create_duckdb_table.sql` (requires the DuckDB CLI `duckdb` on your PATH).
- **`pnpm test`**: Run tests with Vitest.
- **`pnpm test:ui`**: Launch Vitest UI runner.
- **`pnpm test:coverage`**: Run tests and generate coverage.
