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
npm run gen:m3e           # regenerate src/theme/m3e-motion.generated.ts
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

## Design

- Fonts: Figtree (UI) and Instrument Serif (display), linked on both platforms.
- Palette: monochrome, matching the web (`#F5F5F2` / `#111111`, dark `#111111` / `#F5F5F1`).
- Icons: Solar (`@solar-icons/react-native`).
- Motion: M3E spring tokens generated from `@m3e/web`, Reanimated 4. Reduce-motion is respected.
- Glass: `src/ui/Glass.tsx` is a native stand-in for the Liquid Glass look of the web
  `glisse` library (see below).

### About `glisse` and `glissle`

- `glissle` is not on npm (404). It was not used.
- `glisse` (MIT, v0.6.0) is a browser-only React library. It touches `window`,
  `document`, `getComputedStyle` and SVG displacement filters, and peers on
  `react-dom`. It cannot be imported into React Native. Its look was recreated in
  `src/ui/Glass.tsx` with `react-native-svg`.
- The native glass does not blur what is behind it. A true backdrop blur needs a
  native module, which was deliberately not added.

## Native status (honest)

| Item | State |
| --- | --- |
| JS typecheck, lint, Jest | Passing (`npm run typecheck`, `npm run lint`, `npm test`) |
| Android JS bundle | Builds (`react-native bundle --platform android`) |
| iOS JS bundle | Builds (`react-native bundle --platform ios`) |
| Android native build (Gradle) | **Not verified.** No Android SDK in the build environment |
| iOS native build (pods, Xcode) | **Not verified.** Requires macOS |
| AppAuth sign-in on a device | **Not verified.** Needs a provisioned client ID and a device |
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
