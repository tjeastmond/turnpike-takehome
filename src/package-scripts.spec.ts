// @vitest-environment node
import { describe, expect, it } from 'vitest';
import pkg from '../package.json';

describe('package.json scripts', () => {
  it('includes core app scripts', () => {
    expect(pkg.scripts).toMatchObject({
      dev: expect.any(String),
      build: expect.any(String),
      preview: expect.any(String),
      test: expect.any(String),
      'test:ui': expect.any(String),
      'test:coverage': expect.any(String),
    });
  });

  it('includes database helper scripts', () => {
    expect(pkg.scripts).toMatchObject({
      'db:create': expect.any(String),
      'db:create:sql': expect.any(String),
    });
  });
});
