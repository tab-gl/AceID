// Astryx styles are compiled by StyleX at bundle time; Jest has no such plugin, so
// components are replaced with minimal stand-ins in unit tests.
const React = require('react');
const { View } = require('react-native');

module.exports = {
  neutralTheme: {},
  Theme: ({ children }) => children,
  Divider: () => React.createElement(View, { testID: 'astryx-divider', style: { height: 1 } }),
};
