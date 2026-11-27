const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/**
 * Metro configuration with Uniwind for beUI Native components.
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = mergeConfig(getDefaultConfig(__dirname), {});

// Uniwind must be the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
