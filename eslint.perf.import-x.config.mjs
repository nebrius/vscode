import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import pluginImportX from 'eslint-plugin-import-x';

export default defineConfig({
  files: ['src/**/*.{cjs,js,mjs,jsx,ts,tsx,cts,mts}'],
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    'import-x/extensions': ['.ts', '.tsx', '.cts', '.mts', '.js', '.jsx', '.cjs', '.mjs'],
    'import-x/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.cts', '.mts'],
    },
    'import-x/resolver-next': [
      createTypeScriptImportResolver({
        extensions: ['.ts', '.tsx', '.js'],
        extensionAlias: {
          '.js': ['.ts', '.js'],
        },
        project: '.',
      }),
    ],
  },
  plugins: {
    'import-x': pluginImportX,
  },
  rules: {
    'import-x/no-cycle': 'error',
  },
});
