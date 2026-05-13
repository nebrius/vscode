import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import pluginImport from 'eslint-plugin-import';

export default defineConfig({
  files: ['src/**/*.{cjs,js,mjs,jsx,ts,tsx,cts,mts}'],
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    'import/extensions': ['.ts', '.tsx', '.cts', '.mts', '.js', '.jsx', '.cjs', '.mjs'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.cts', '.mts'],
    },
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  plugins: {
    'import': pluginImport,
  },
  rules: {
    'import/no-cycle': 'error',
  },
});
