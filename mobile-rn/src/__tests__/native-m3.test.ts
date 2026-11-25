// Selection between the native react-native-m3 views and the SVG fallback.

// Platform is Android for these cases; react-native-m3 is Android-only.
const androidPlatform = () => jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));

describe('native M3 availability', () => {
  it('is null on iOS even when the module would load', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
      jest.doMock('react-native-m3', () => ({ LoadingIndicator: () => null, WavyProgressIndicator: () => null }));
      const { nativeM3 } = require('@/design-system/native/m3');
      expect(nativeM3).toBeNull();
    });
  });

  it('is null when the native module is not linked (fallback path)', () => {
    jest.isolateModules(() => {
      androidPlatform();
      jest.doMock('react-native-m3', () => {
        throw new Error('Native module M3 not found');
      });
      const { nativeM3 } = require('@/design-system/native/m3');
      expect(nativeM3).toBeNull();
    });
  });

  it('is available when the module exposes both views', () => {
    jest.isolateModules(() => {
      androidPlatform();
      jest.doMock('react-native-m3', () => ({
        LoadingIndicator: () => null,
        WavyProgressIndicator: () => null,
      }));
      const { nativeM3 } = require('@/design-system/native/m3');
      expect(nativeM3).not.toBeNull();
      expect(typeof nativeM3.LoadingIndicator).toBe('function');
    });
  });

  it('is null when the module is partial', () => {
    jest.isolateModules(() => {
      androidPlatform();
      jest.doMock('react-native-m3', () => ({ LoadingIndicator: () => null }));
      const { nativeM3 } = require('@/design-system/native/m3');
      expect(nativeM3).toBeNull();
    });
  });
});
