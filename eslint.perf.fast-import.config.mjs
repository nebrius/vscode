import { join } from 'node:path';

import { defineConfig } from 'eslint/config';
import tsParser from '@typescript-eslint/parser';

import plugin from 'import-integrity-lint';

const debugLogging = process.env.DEBUG_LOGGING === '1';

export default defineConfig({
  files: ['src/**/*.{cjs,js,mjs,jsx,ts,tsx,cts,mts}'],
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: {
    'import-integrity': plugin,
  },
  settings: {
    'import-integrity': {
      packageRootDir: join(import.meta.dirname, 'src'),
      debugLogging
    },
  },
  rules: {
    'import-integrity/no-cycle': 'error',
  },
});
