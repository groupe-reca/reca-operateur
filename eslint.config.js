// Flat ESLint config using Expo's shared rules (eslint-config-expo).
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      '.expo/*',
      'android/*',
      'ios/*',
      'scripts/*',
      'plugins/*',
      '.input/**',
      '*.config.cjs',
    ],
  },
];
