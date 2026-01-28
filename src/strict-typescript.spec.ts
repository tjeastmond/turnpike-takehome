// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('strict TypeScript setup', () => {
  it('has a strict tsconfig.json', () => {
    const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const tsconfig = readJson(tsconfigPath) as { compilerOptions?: Record<string, unknown> };
    expect(tsconfig.compilerOptions?.strict).toBe(true);
  });

  it('uses a TypeScript entrypoint', () => {
    const mainTsx = path.join(repoRoot, 'src', 'main.tsx');
    const mainJsx = path.join(repoRoot, 'src', 'main.jsx');
    expect(fs.existsSync(mainTsx)).toBe(true);
    expect(fs.existsSync(mainJsx)).toBe(false);
  });

  it('index.html points at the TS entrypoint', () => {
    const indexHtmlPath = path.join(repoRoot, 'index.html');
    const html = fs.readFileSync(indexHtmlPath, 'utf8');
    expect(html).toContain('src="/src/main.tsx"');
  });
});
