module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['@coxy/eslint-config/backend', 'plugin:prettier/recommended'],
  plugins: ['@typescript-eslint'],

  rules: {
    'react-hooks/exhaustive-deps': [0],
    'comma-dangle': ['error', 'always-multiline'],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
      },
    ],
  },
}
