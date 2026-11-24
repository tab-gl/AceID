# Ace ID for React Native

The React Native (Expo) client for **Ace ID by The Ace Base**. It is a rebuild of the
Android client (`mobile/`) with the same screens, OIDC sign-in, account API behaviour
and offline cache, on one codebase for iOS, Android and the web preview.

## What it does

| Area | Behaviour |
| --- | --- |
| Sign-in | OIDC authorization code + PKCE (S256) through the system browser. Discovery is pinned to the configured issuer. |
| Tokens | Stored in Keychain / Android Keystore (chunked, because ID tokens exceed the per-value limit). Refreshed 60 s before expiry; only a provider rejection (`invalid_grant`, `invalid_client`, `unauthorized_client`) ends the session. |
| Sign-out | Revokes refresh and access tokens (RFC 7009), opens RP-initiated logout, then clears local state and the cache. |
| Home | Profile summary, username, verification state, shortcuts. |
| Security | Signed-in devices and recent activity, with partial-failure handling. |
| Connected apps | List and disconnect apps, with a confirmation dialog. |
| ID | Edit display name, username, email and avatar (only changed fields are sent). Links to the hosted security, devices and danger-zone pages. |
| Cache | ETag/304 revalidation, 7-day expiry, served when offline. Mutations clear it. Auth failures are never masked by cached data. |

## Design system

- **Palette:** monochrome Paper `#F5F5F2` / Ink `#111111` with hairline borders, and a dark variant. There is no accent colour.
- **Typography:** Instrument Serif for display copy, Satoshi for UI copy (the same files as the Android client, in `assets/fonts`).
- **Logo and icons:** the Ace ID lockup from the Android launcher artwork, and the 24dp outline icon set from `web-icons/` (generated from the Android `AceIcons`).
- **Motion and shape:** the m3e Material 3 Expressive springs (generated from the published `@m3e/web` package by `npm run gen:m3e`) and the m3e shape scale. The floating tab bar uses a `default-spatial` expressive spring.

### About `@m3e/web`

`@m3e/web` is a Lit/DOM web-component library. It cannot be mounted inside React Native,
so this app consumes its published **design tokens** (spring stiffness and damping ratios, and
the shape scale), and implements the matching components natively with
Reanimated and react-native-svg. A web-only build could use the components directly.

## Configuration

Copy `.env.example` to `.env` (untracked) and set public values only. Client secrets never belong here.

| Variable | Default |
| --- | --- |
| `EXPO_PUBLIC_ACEID_ISSUER` | `https://identity.ace-base.cc` |
| `EXPO_PUBLIC_ACEID_API_BASE_URL` | the issuer |
| `EXPO_PUBLIC_ACEID_CLIENT_ID` | empty. Sign-in shows a configuration error until it is set. |

The redirect URI is `app.tab.aid:/oauth2redirect` (the `scheme` in `app.json`), the same as the Android client.

## Develop

```sh
cd mobile-rn
npm install
npm start            # Expo dev server (press a, i, or w)
npm run typecheck
npm run lint
npm test             # Jest: API client, cache, origin guard, JWT, error copy, motion tokens
npx expo export --platform web      # production web bundle
npx expo export --platform android  # production Android bundle
```

Sign-in uses a custom URL scheme, so it needs a development build (`npx expo run:android` or
`eas build --profile development`), not Expo Go. The web preview renders the signed-out and
layout screens. Token storage on web falls back to AsyncStorage and is not a supported place for real tokens.

## Layout

| Path | Responsibility |
| --- | --- |
| `src/app/` | Expo Router routes. `_layout.tsx` gates routes on session state; `(tabs)/` holds the four signed-in screens. |
| `src/auth/` | Config, OIDC flow, token storage, session provider, JWT display claims. |
| `src/api/` | Account API client, cache, error copy, tolerant JSON readers, the focus-aware loader hook. |
| `src/components/` | Brand, floating tab bar, shared UI kit, sheet, dialog, toast. |
| `src/theme/` | Palette, typography, shape, m3e motion (generated), theme provider. |
| `src/icons/` | Generated icon and logo path data, and the icon component. |
| `scripts/gen-m3e-motion.mjs` | Generates the motion tokens from `@m3e/web`. |
| `src/__tests__/` | Unit tests for the logic that carries risk. |
