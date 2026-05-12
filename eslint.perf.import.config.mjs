import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import pluginImport from 'eslint-plugin-import';

export default defineConfig(
  {
    files: ['src/**/*.{js,mjs,jsx,ts,tsx,mts}'],
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
      'import/no-unused-modules': ['error', { 'unusedExports': true, src: ['src/**/*.{js,mjs,jsx,ts,tsx,mts}'] }],
      'import/no-unresolved': 'error',
    },
  }
);
