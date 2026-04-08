# NJ 1099 Tax Calculator

A comprehensive tax calculator web application for 1099 contractors in New Jersey. Calculate your estimated taxes, track expenses, and manage home office deductions with an intuitive React-based interface.

## Features

- **Income & Expense Tracking**: Input your 1099 income and track deductible business expenses
- **Tax Calculations**: Automatically calculate federal and New Jersey state taxes based on your filing status
- **Home Office Deduction**: Calculate home office deductions using the simplified method
- **Retirement Contributions**: Factor in retirement contributions to reduce taxable income
- **Data Persistence**: Automatically saves your progress to browser localStorage
- **Export/Import**: Export your data as JSON or import previously saved data

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + PostCSS
- **Testing**: Vitest with jsdom
- **Icons**: Lucide React

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **pnpm** (package manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/tjeastmond/turnpike-takehome.git
cd turnpike-takehome
```

2. Install dependencies:
```bash
pnpm install
```

## Usage

### Development Server

Start the development server (runs on port 4000):
```bash
pnpm dev
```

Open your browser to `http://localhost:4000` to use the calculator.

### Building for Production

Build the production bundle:
```bash
pnpm build
```

Preview the production build:
```bash
pnpm preview
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server on port 4000 |
| `pnpm build` | Build production bundle |
| `pnpm preview` | Serve production build locally |
| `pnpm test` | Run tests with Vitest |
| `pnpm test:ui` | Launch Vitest UI runner |
| `pnpm test:coverage` | Run tests and generate coverage |
| `pnpm typecheck` | Run TypeScript type checking |

## Project Structure

```
.
├── scripts/                 # Utility scripts
├── src/                     # Source code
│   ├── main.tsx             # React entry point
│   ├── TaxCalculator.tsx    # Main calculator component
│   └── index.css            # Tailwind CSS directives
├── index.html               # Vite entry HTML
├── package.json             # Dependencies and scripts
├── pnpm-lock.yaml           # Lockfile for reproducible installs
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── postcss.config.js         # PostCSS configuration
```

## Key Features Explained

### Tax Calculations

The calculator computes:
- Adjusted Gross Income (AGI)
- Taxable Income (after deductions)
- Federal Income Tax
- New Jersey State Tax
- Self-Employment Tax
- Total Tax Liability
- Estimated Quarterly Payments

### Data Persistence

All form data is automatically saved to browser localStorage and restored when you reload the page. You can also:
- Export data as JSON
- Import previously exported data
- Clear all data to start fresh

### Home Office Deduction

Calculate home office deductions using:
- Office dimensions (length × width)
- Total home square footage
- Mortgage payment, property taxes, insurance
- Utilities and internet costs

## Development

### Type Checking

Run TypeScript type checking:
```bash
pnpm typecheck
```

### Testing

Run the test suite:
```bash
pnpm test
```

Generate test coverage:
```bash
pnpm test:coverage
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Important Disclaimer**: This software is provided "as is" without warranty of any kind. The authors and copyright holders are not liable for any claims, damages, or other liability arising from the use of this software, including but not limited to tax filing errors or miscalculations. Always consult with a qualified tax professional before filing your taxes.
