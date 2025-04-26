import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['import'],
  categories: { correctness: 'off' },
  rules: {
    'import/no-cycle': 'error',
  },
});
