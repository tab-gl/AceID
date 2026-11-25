module.exports = {
  assets: ['./assets/fonts'],
  dependencies: {
    // react-native-m3 ships Android views only; its iOS pod references Swift classes
    // that do not exist yet, so keep it out of iOS autolinking. iOS uses the SVG loader.
    'react-native-m3': { platforms: { ios: null } },
  },
};
