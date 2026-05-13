import { join } from 'node:path';

import { defineConfig } from 'oxlint';

const debugLogging = process.env.DEBUG_LOGGING === '1';

export default defineConfig({
  jsPlugins: [{ name: 'import-integrity', specifier: 'import-integrity-lint' }],
  categories: { correctness: 'off' },
  rules: {
    'import-integrity/no-cycle': 'error',
  },
  settings: {
    'import-integrity': {
      packageRootDir: join(import.meta.dirname, 'src'),
      debugLogging
    },
  },
});
