/* global jest */

// In-memory AsyncStorage: the subset the app uses, with real async semantics.
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  const api = {
    getItem: async (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: async (key, value) => {
      store[key] = String(value);
    },
    removeItem: async (key) => {
      delete store[key];
    },
    getAllKeys: async () => Object.keys(store),
    clear: async () => {
      store = {};
    },
  };
  return { __esModule: true, default: api, ...api };
});

// Reanimated's native runtime cannot start under Jest. This stub keeps the same
// API surface the app uses and runs animation callbacks synchronously.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const RN = require('react-native');
  // Layout presets (FadeIn.duration(...)) are chainable objects.
  const makeLayout = () => {
    const api = {};
    ['duration', 'delay', 'springify', 'easing'].forEach((key) => {
      api[key] = () => api;
    });
    return api;
  };
  const interpolate = (x, input, output) => {
    if (x <= input[0]) return output[0];
    if (x >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i += 1) {
      if (x >= input[i] && x <= input[i + 1]) {
        const t = (x - input[i]) / (input[i + 1] - input[i]);
        return output[i] + t * (output[i + 1] - output[i]);
      }
    }
    return output[0];
  };
  const Animated = {
    View: RN.View,
    Text: RN.Text,
    ScrollView: RN.ScrollView,
    Image: RN.Image,
    createAnimatedComponent: (component) => component,
  };
  const timing = (value, _config, done) => {
    if (typeof done === 'function') done(true);
    return value;
  };
  return {
    __esModule: true,
    default: Animated,
    createAnimatedComponent: Animated.createAnimatedComponent,
    useSharedValue: (initial) => React.useRef({ value: initial }).current,
    useAnimatedStyle: (factory) => factory(),
    useAnimatedScrollHandler: () => () => undefined,
    useAnimatedProps: (factory) => factory(),
    useDerivedValue: (factory) => ({ value: factory() }),
    withSpring: (value) => value,
    withTiming: timing,
    withDelay: (_delay, value) => value,
    withRepeat: (value) => value,
    withSequence: (...values) => values[values.length - 1],
    cancelAnimation: () => undefined,
    runOnJS: (fn) => fn,
    interpolate,
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
    interpolateColor: (_value, _input, output) => (Array.isArray(output) ? output[0] : '#111111'),
    Easing: {
      bezier: () => (t) => t,
      inOut: () => (t) => t,
      out: () => (t) => t,
      quad: (t) => t,
      linear: (t) => t,
      cubic: (t) => t,
      ease: (t) => t,
      in: (fn) => fn,
      back: () => (t) => t,
    },
    FadeIn: makeLayout(),
    FadeOut: makeLayout(),
  };
});

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK' },
  setGenericPassword: jest.fn(async () => ({ service: 'test', storage: 'mock' })),
  getGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
}));

jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  default: { trigger: jest.fn(), impact: jest.fn() },
}));

jest.mock('react-native-app-auth', () => ({
  authorize: jest.fn(),
  refresh: jest.fn(),
  revoke: jest.fn(async () => undefined),
  logout: jest.fn(),
}));

// Solar exposes its icon styles only through import-only subpath exports, which
// Jest's CommonJS resolver cannot read. Icons carry no behaviour under test, so
// each named export becomes a small stand-in component.
const mockSolarStandIn = () => {
  const React = require('react');
  const { Text } = require('react-native');
  const cache = {};
  const component = (name) =>
    (cache[name] ??= (props) => React.createElement(Text, { testID: `icon-${name}`, accessibilityLabel: props.alt }, null));
  return new Proxy(
    { __esModule: true },
    {
      get: (target, key) => (typeof key === 'string' && key !== 'then' ? (key in target ? target[key] : component(key)) : undefined),
    },
  );
};
jest.mock('@solar-icons/react-native/linear', () => mockSolarStandIn(), { virtual: true });
jest.mock('@solar-icons/react-native/bold', () => mockSolarStandIn(), { virtual: true });

// Gesture recognition is native and not under test. The detector passes its
// children through; gesture builders are chainable no-ops.
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const RN = require('react-native');
  const chain = new Proxy(function chainable() {}, {
    get: (_target, key) => (key === 'then' ? undefined : () => chain),
  });
  return {
    GestureHandlerRootView: ({ children, style }) => React.createElement(RN.View, { style }, children),
    GestureDetector: ({ children }) => children,
    Gesture: { Pan: () => chain, Tap: () => chain, Simultaneous: () => chain, Race: () => chain },
    State: {},
    Directions: {},
  };
});

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn, ...args) => {
    if (typeof fn === 'function') fn(...args);
  },
}));

jest.mock('uniwind', () => ({
  useResolveClassNames: () => ({
    backgroundColor: '#111111',
    color: '#111111',
    borderColor: '#D1D1CC',
  }),
  useUniwind: () => ({ theme: 'light' }),
  Uniwind: { setTheme: jest.fn() },
}));
