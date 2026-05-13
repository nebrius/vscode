import { defineConfig } from 'eslint/config';
import tsParser from '@typescript-eslint/parser';

export default defineConfig({
  files: ['src/**/*.{cjs,js,mjs,jsx,ts,tsx,cts,mts}'],
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-debugger': 'error',
  },
});
