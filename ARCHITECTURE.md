# Ace ID — Architecture

Ace ID is the OpenID Connect identity layer of The Ace Base: one authorization
server in front of Ace Base accounts, with a web client, a native Android app,
client SDKs, and a CLI. This page describes how the pieces fit together.

## Component map

| Component | Repository | Role |
| --- | --- | --- |
| Edge + clients | `tab-gl/AceID` (public) | Vercel edge functions (proxies), web account client, native Android app |
| Identity backend | `aceyash-dev/ace-id` (private) | OIDC provider, account APIs, login/MFA/reset flows, server-rendered auth pages |
| Client SDKs | `tab-gl/aid-sdk` (public) | TypeScript web SDK, Android (Kotlin), iOS (Swift) — token handling, ID-token verification |
| CLI | `tab-gl/aid-cli` (public) | Native Rust tool for app/client management and authentication |
| Developer console | `tab-gl/AIDC` (public) | Web frontend for managing Ace ID applications and integrations |
| Documentation | `tab-gl/ace-docs` | This site |

## Deployment topology

```
browser / Android app / SDK / CLI
        │  (TLS)
        ▼
Vercel deployment  ── identity.ace-base.cc
  ├── static web client (public/)
  ├── api/[...path].js      account API proxy      ─┐
  └── api/oidc/[...path].js OIDC provider proxy    ─┤ (TLS, pinned upstream)
                                                    ▼
                                          Deplexo edge (routes by Host)
                                                    ▼
                                          identity backend (private)
```

The Vercel layer is a thin, hardened routing tier — it holds no identity logic.
`vercel.json` rewrites map the public surface (`/auth`, `/token`, `/me`,
`/jwks`, `/login*`, `/register`, `/interaction/*`, `/account*`, …) onto the two
proxy functions. The proxies forward to a single operator-configured HTTPS
origin (`ACEID_API_BASE_URL`, rejected unless it is a bare origin with no
path/query/credentials).

## Edge proxies

Both proxies (`api/[...path].js` for account APIs, `api/oidc/[...path].js` for
the provider) share one security model:

- **Path allowlist.** Only the endpoints the clients call are forwarded; the
  rest 404 before leaving the edge. The allowlist is checked on the raw path
  *and* on its percent-decoded, dot-resolved form, so encoded traversal
  (`/login/..%2f..%2fadmin`) cannot widen the match to another endpoint.
- **Method allowlist.** Only `GET/HEAD/POST/PUT/PATCH/DELETE/OPTIONS`.
- **Host pinning.** `Host` is rewritten to the upstream host (the Deplexo edge
  routes on it); the public host travels in `X-Forwarded-Host` and is only
  echoed when it matches `ACEID_PUBLIC_HOSTS` — the provider trusts that header
  when building redirect URLs and email links, so echoing a raw Host header
  would be host-header injection.
- **Header hygiene.** Hop-by-hop headers stripped both ways; responses are
  `no-store`; upstream TLS to a pinned origin (SNI = upstream host).
- **HTML vs JSON errors.** Browser navigations get a readable error page
  (escaped text); API clients get JSON.

## Authentication flows

- **Sign-in:** authorization code + PKCE (S256), standard OIDC discovery. The
  Android app drives it through AppAuth in a Custom Tab with a platform-derived
  redirect scheme; the web client uses full-page redirects to the provider's
  server-rendered login/MFA/reset pages.
- **Tokens:** the backend issues access/refresh/ID tokens. SDKs verify ID-token
  signatures against the issuer JWKS with an asymmetric-algorithm allowlist
  (`none`/HMAC refused) and issuer pinning on discovery.
- **Refresh:** clients refresh with a 60-second expiry skew under a mutex;
  only `invalid_grant`/`invalid_client`/`unauthorized_client` rejections end
  the session — transport failures surface as errors without dropping it.
- **Sign-out:** RFC 7009 token revocation (best effort), then RP-initiated
  logout, then local session cleanup.

## Android app

Layered Kotlin/Compose (`mobile/`):

| Layer | Contents |
| --- | --- |
| `ui/` | Screens (Home tabs, Overview, Profile, Security, Connected apps, Sign-in), shared components incl. the `AceIcons` 24dp outline set, theme (monochrome Paper/Ink, Instrument Serif + Satoshi) |
| `ui/vm/` | StateFlow ViewModels per screen; partial-success loading; cancellation-safe |
| `data/` | `AceIdApi` (bearer-token origin guard, ETag/304 + 7-day encrypted offline cache), `SecureStore` (AES-256-GCM in Android Keystore), `SessionStore`, JWT/profile parsing (display only) |
| `auth/` | `AuthRepository`: AppAuth flows, PKCE, refresh, revocation |

Session state lives in the Keystore-backed store (`allowBackup` off, cleartext
traffic off). A per-session `ViewModelStoreOwner` is torn down on sign-out so
one account's data cannot leak into the next.

## Web client

Static client served from `public/` (account display screens: profile,
security, devices, connected apps, danger zone) with the same icon set and
screen structure as the Android app. All data operations go through the account
proxy; auth flows are the provider's server-rendered pages.

## SDKs & CLI

`aid-sdk` ships TypeScript (web), Kotlin (Android), and Swift (iOS) clients:
discovery caching with issuer/endpoint pinning, PKCE via `SecureRandom`-backed
verifiers, ID-token verification, refresh, and logout. `aid-cli` (Rust) covers
app registration and device/CLI authentication against the same provider.

## Security boundaries

1. **Edge → backend:** allowlisted paths/methods, pinned upstream origin,
   validated public host, stripped hop-by-hop headers, `no-store` responses.
2. **Backend:** authoritative identity store; renders login/MFA/reset; validates
   PKCE, state, nonce, redirect URIs.
3. **Clients:** verify tokens cryptographically (SDKs) or treat claims as
   display data (app profile screen), store tokens in platform secure storage,
   send bearer tokens only to HTTPS (or loopback) origins.

## Testing

Node tests cover the edge proxies (allowlist, traversal, host pinning, method
filtering, upstream-origin validation, error-page content) and JUnit covers the
Android layers (auth error mapping, refresh rejection handling, revocation
bodies, API errors/origins, JWT, response cache, dates, icons). Both run in CI
(`android.yml`, `frontend-api-proxy.yml`).
