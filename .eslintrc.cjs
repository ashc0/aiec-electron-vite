module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts', 'vitest.config.ts', 'playwright.config.ts', 'postcss.config.cjs', 'tailwind.config.js', '/src/public/pc-components'],
  plugins: ['react', '@typescript-eslint'],
  rules: {
    // complexity: ['warn', 3],
    'react/react-in-jsx-scope': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'class-methods-use-this': 'off',
    'max-len': ['warn', { code: 120 }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
  },
};
