import { join } from 'node:path';

import { defineConfig } from 'oxlint';

export default defineConfig({
  jsPlugins: [{ name: 'fast-import', specifier: 'eslint-plugin-fast-import' }],
  categories: { correctness: 'off' },
  rules: {
    'fast-import/no-cycle': 'error',
  },
  settings: {
    'fast-import': {
      packageRootDir: join(import.meta.dirname, 'src'),
    },
  },
});
