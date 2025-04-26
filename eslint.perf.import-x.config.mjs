import tsParser from '@typescript-eslint/parser';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import pluginImportX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['src/**/*.{js,mjs,jsx,ts,tsx,mts}'],
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
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
  extends: [pluginImportX.flatConfigs.recommended, pluginImportX.flatConfigs.typescript],
  rules: {
    'import-x/no-cycle': 'error',
    'import-x/no-unused-modules': ['error', { 'unusedExports': true }],
    'import-x/no-unresolved': 'error',
  },
});
