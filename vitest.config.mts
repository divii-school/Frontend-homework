import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src') } },
  // .tsx tests render components to HTML (react-dom/server); tsconfig keeps JSX for Next.js, so
  // Vitest needs its own JSX transform.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
