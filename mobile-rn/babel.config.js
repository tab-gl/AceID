module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // `@/...` imports resolve to ./src (mirrors the tsconfig `paths` entry).
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: { '^@/(.+)': './src/\\1' },
      },
    ],
    // Reanimated 4 requires the worklets plugin, which must come last.
    'react-native-worklets/plugin',
  ],
};
