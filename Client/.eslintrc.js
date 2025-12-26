module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'react-app',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'react/prop-types': 'off',
    'no-undef': 'warn',
    'no-console': 'off',
  },
  ignorePatterns: [
    'build/',
    'node_modules/',
    '*.config.js',
    'src/setupTests.js',
    'src/reportWebVitals.js',
  ],
};