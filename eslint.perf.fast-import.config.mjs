import { join } from 'node:path';

import tsParser from '@typescript-eslint/parser';
import { getDirname } from 'cross-dirname';
import tseslint from 'typescript-eslint';

import plugin from 'eslint-plugin-fast-import';

export default tseslint.config({
  files: ['src/**/*.{js,mjs,jsx,ts,tsx,mts}'],
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: {
    'fast-import': plugin,
  },
  settings: {
    'fast-import': {
      packageRootDir: join(getDirname(), 'src'),
      debugLogging: true
    },
  },
  rules: {
    'fast-import/no-cycle': 'error',
    'fast-import/no-unused-exports': 'error',
    'fast-import/no-unresolved-imports': 'error',
  },
});
