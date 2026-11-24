# AceID (React Native)

Native companion app for [Ace ID](https://identity.ace-base.cc), the OpenID Connect
identity platform. Bare React Native 0.88 (no Expo). Package and OAuth redirect
scheme: `app.tab.aid`.

Source of truth for behaviour: the Ace ID identity service (`aceyash-dev/ace-id`,
private) and the discovery document at
`https://identity.ace-base.cc/.well-known/openid-configuration`. The in-repo
`ARCHITECTURE.md` and the Kotlin client in `../mobile` document the same contract.

## Requirements

- Node 20+, npm
- Android: JDK 17, Android SDK 35
- iOS: macOS, Xcode 16+, CocoaPods (`bundle install` then `bundle exec pod install`)

## Commands

```sh
npm install
npm start                 # Metro
npm run android           # or: npm run ios
npm run typecheck         # tsc --noEmit
npm run lint              # eslint
npm test                  # jest (24+ tests)
npm run gen:m3e           # regenerate src/design-system/tokens/m3e-motion.generated.ts
```

## Configuration

`src/config.ts` holds build-time constants. This is a **public** OIDC client: it
has an issuer, an API origin, a client ID and a redirect URI, and never a secret.

- `CLIENT_ID` is **empty**. Sign-in is disabled until a registered public mobile
  client is provisioned, and the app says so instead of falling back to a web login.
- The redirect URI is `app.tab.aid:/oauth2redirect`. It must be registered exactly.
  Android reads the scheme from `appAuthRedirectScheme` in `android/app/build.gradle`;
  iOS registers it in `ios/AceId/Info.plist` (`CFBundleURLTypes`).

## Security model

- **Flow:** Authorization Code with PKCE (S256), via `react-native-app-auth`.
  Scopes: `openid profile email offline_access`.
- **State and PKCE:** `state` generation and verification and the code verifier are
  handled inside AppAuth (AppAuth-Android and AppAuth-iOS). This app does not
  reimplement them.
- **Token storage:** access, refresh and ID tokens are in the platform secure store
  (`react-native-keychain`: iOS Keychain, Android Keystore). AsyncStorage is never used
  for tokens.
- **ID-token checks** (`src/auth/jwt.ts`, `idTokenClaimProblem`): on sign-in the app
  requires `sub`, `iss` equal to the configured issuer, `aud` containing the client ID
  (and `azp` for multi-audience tokens), and an unexpired `exp`.
  - **Not yet:** JWKS signature verification. Hermes has no suitable crypto for RS256.
    The token is received directly from the token endpoint over TLS, which OIDC Core
    3.1.3.7 permits. Adding JWKS verification is a follow-up.
- **Refresh:** serialised. Only `invalid_grant`, `invalid_client` or
  `unauthorized_client` end the session. Offline, timeouts and 5xx keep it.
  Android and iOS both expose the OAuth error code through AppAuth.
- **Sign-out:** revokes the refresh and access tokens (RFC 7009, best effort), opens
  RP-initiated logout (`end_session_endpoint` with `id_token_hint`), then clears local
  state and the response cache.
- **Discovery:** the issuer in the discovery document must match the configured issuer.
  Authorization and token endpoints must be HTTPS (loopback HTTP allowed for development).

## Design system

Hybrid, in `src/design-system/`:

- `tokens/`: AceID palette, type, spacing, shape, glass parameters, M3E springs
  (`m3e-motion.generated.ts`), and the M3 monochrome roles (`m3-monochrome.ts`,
  computed with `@material/material-color-utilities` `SchemeMonochrome`).
- `glass/`: Liquid Glass for every non-progress surface. `GlassSurface` renders a
  real backdrop blur through `react-native-blur-overlay` where the device supports it
  (iOS 15.1+ and Android 12+/API 31+), and a translucent material with rim and sheen
  elsewhere. Chrome that floats over pages (tab bar, toasts) uses blur; sheets sit in
  a `Modal` window and use the material.
- `loading/`: M3 Expressive loading indicator (shape-morphing, contained and
  uncontained; indeterminate, as M3E specifies for the loader) and `LoadingBlock` for skeleton-like
  placeholders.
- `progress/`: M3 Expressive linear and circular progress, flat or wavy, determinate
  and indeterminate, driven by Reanimated.
- `hooks/`: `useGlassMode`, `useMonochrome`, `useReduceMotion`.

Rules: M3 Expressive is used only for loading and progress. Liquid Glass is never used
for progress. Reduce-motion turns off morphing, wave motion and glass transitions.

Fonts: Figtree (UI) and Instrument Serif (display), linked on both platforms.
Icons: Solar (`@solar-icons/react-native`).

### Platform limits

- `react-native-blur-overlay` 3.2.1 is young and was measured by its author on one
  low-end Android device. Its `glass` mode (iOS 26 `UIGlassEffect`, Android 13+ AGSL
  lens) has not been verified on device here.
- Live Android blur needs a `<BlurTarget>` in the same window. The overlay must not be
  nested inside a target. `SurfaceView` content (video, maps, camera) renders blank
  under capture-based blur.
- `glisse` is web-only (`window`, `document`, SVG filters) and cannot run in React
  Native. `glissle` is not on npm. Neither is used.

## Native status (honest)

| Item | State |
| --- | --- |
| JS typecheck, lint, Jest | Passing (`npm run typecheck`, `npm run lint`, `npm test`, 38 tests) |
| Android JS bundle | Builds (`react-native bundle --platform android`) |
| iOS JS bundle | Builds (`react-native bundle --platform ios`) |
| Android native build (Gradle) | **Not verified.** No Android SDK in the build environment |
| iOS native build (pods, Xcode) | **Not verified.** Requires macOS |
| AppAuth sign-in on a device | **Not verified.** Needs a provisioned client ID and a device |
| Native Liquid Glass (blur, `glass` mode) and M3E motion on device | **Not verified.** JS bundles do not prove native blur or animation |
| iOS URL callback into AppAuth | **Unverified.** `SceneDelegate` forwards URLs to `RCTLinkingManager`. Confirm that AppAuth resumes the flow on a device |
| Animation quality on a device | **Not reviewed** |
| Visual parity with the website | Partial: palette, fonts and copy match. Not pixel-compared |

## Open items

1. Provision a public mobile OIDC client and set `CLIENT_ID`. Options for the identity
   team: a registered client with `app.tab.aid:/oauth2redirect`, or a client ID metadata
   document. The discovery document advertises `client_id_metadata_document_supported`.
   Do not hand out a shared client secret.
2. JWKS signature verification of ID tokens.
3. Build and test on Android and iOS devices; confirm the browser round trip and
   logout.
4. Real-device motion review.
