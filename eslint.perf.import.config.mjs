import tsParser from '@typescript-eslint/parser';
import pluginImport from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['src/**/*.{js,mjs,jsx,ts,tsx,mts}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    extends: [pluginImport.flatConfigs.recommended, pluginImport.flatConfigs.typescript],
    rules: {
      'import/no-cycle': 'error',
      'import/no-unused-modules': ['error', { 'unusedExports': true }],
      'import/no-unresolved': 'error',
    },
  }
);
