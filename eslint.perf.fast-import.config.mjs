import { join } from 'node:path';

import { defineConfig } from 'eslint/config';
import tsParser from '@typescript-eslint/parser';

import plugin from 'import-integrity-lint';

export default defineConfig({
  files: ['src/**/*.{js,mjs,jsx,ts,tsx,mts}'],
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
      debugLogging: true
    },
  },
  rules: {
    'import-integrity/no-cycle': 'error',
    'import-integrity/no-unused-exports': 'error',
    'import-integrity/no-unresolved-imports': 'error',
  },
});
