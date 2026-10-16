module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'jsdoc', 'boundaries'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:jsdoc/recommended',
    'prettier',
  ],
  settings: {
    jsdoc: { mode: 'typescript' },
    'boundaries/elements': [
      { type: 'controller', pattern: 'src/modules/*/controllers' },
      { type: 'service', pattern: 'src/modules/*/services' },
      { type: 'repository', pattern: 'src/modules/*/repositories' },
      { type: 'dto', pattern: 'src/modules/*/dto' },
    ],
  },
  rules: {
    // SRP
    'max-classes-per-file': ['error', 1],
    'max-lines-per-function': ['warn', 50],
    'max-lines': ['warn', 300],

    // DIP
    'no-new': 'error',

    // Interface Segregation
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

    // Clean Imports
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal'],
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    // Architecture Boundaries
    'boundaries/element-types': [
      2,
      {
        default: 'disallow',
        rules: [
          { from: 'controller', allow: ['service', 'dto'] },
          { from: 'service', allow: ['repository', 'dto'] },
          { from: 'repository', allow: ['dto'] },
        ],
      },
    ],

    // JSDoc comments
    'jsdoc/require-jsdoc': [
      'warn',
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
        },
      },
    ],

    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
