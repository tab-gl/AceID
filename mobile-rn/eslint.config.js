const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expo,
  {
    ignores: ['dist/*', 'src/icons/ace-icon-paths.ts', 'src/icons/logo-path.ts', 'src/theme/m3e-motion.generated.ts'],
  },
]);
