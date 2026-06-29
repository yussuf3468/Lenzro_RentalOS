import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules', 'supabase/functions/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      /**
       * Feature-boundary enforcement: a feature may import another feature's
       * PUBLIC API (@/features/<name>) but never reach into its internals.
       * Own-feature code uses relative imports, which are unaffected.
       */
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                "Import a feature's public API only (@/features/<name>). No deep cross-feature imports.",
            },
          ],
        },
      ],
    },
  },
  /* Test files: allow vitest/jsdom globals. */
  {
    files: ['src/test/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  /*
   * Fast-Refresh rule is irrelevant for non-HMR modules:
   * - shadcn/ui primitives co-locate variant helpers (cva) with components;
   * - the route manifest co-locates lazy() component refs with the router export.
   */
  {
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/app/routes/**/*.{ts,tsx}',
      'src/app/providers/index.tsx',
      'src/features/*/routes.tsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
);
