---
title: Ace ID Icon Set
description: Outline icon set shared by the Ace ID web client and Android app — geometry, naming, and usage reference.
---

# Ace ID Icon Set

The Ace ID clients (web and Android) share a single outline icon set: geometric,
black-on-white, square-capped strokes. The Android app embeds the set as
`AceIcons` (Compose `ImageVector`s) and the web client uses the same geometry as
SVG. Both are generated from one source of truth, so a change to an icon updates
everywhere.

## Design spec

| Property | Value |
| --- | --- |
| Viewport | `24 × 24` (default render `24px`/`24dp`) |
| Stroke width | `1.8` |
| Stroke cap | `square` |
| Stroke join | `miter` |
| Fill | none (outline only) |
| Safe margin | `3.5` from the viewport edge |
| Color | `currentColor` on web, theme tint on Android |

Icons are monochrome: tint them with CSS `color` on web or the Compose theme on
Android. Do not recolor paths individually.

## Icons

Base icons (34):

| Name | Also known as | Shows |
| --- | --- | --- |
| `home` | | house — the Home tab |
| `user` | | person — profile, account |
| `shield` | | shield with keyhole — security |
| `shield-check` | | verified shield — verified ID |
| `login` | | arrow into door — sign in |
| `logout` | | arrow out of door — sign out |
| `grid` | | four squares — apps/connected apps |
| `key` | | key — password & sign-in |
| `link` | | chain — connections |
| `link-off` | | broken chain — no/revoke connections |
| `computer` | `devices` | monitor + phone — devices |
| `settings` | `gear` | gear — preferences |
| `bell` | | bell — notifications on |
| `bell-off` | | crossed bell — notifications off |
| `mail` | | envelope — email |
| `edit` | `pencil` | pencil — edit a field |
| `compose` | | pencil over page — compose/create |
| `delete` | `trash` | trash — delete |
| `history` | `clock` | octagonal clock — recent activity |
| `eye` | | eye — show/hide value |
| `eye-off` | | crossed eye — value hidden |
| `copy` | | overlapping sheets — copy |
| `clipboard-check` | | clipboard with check — verified passkey/2FA |
| `check` | | check mark — confirm |
| `close` | | X — dismiss |
| `fingerprint` | | fingerprint — passkeys & 2FA |
| `scan` | | QR frame — scan |
| `refresh` | | circular arrows — retry/refresh |
| `download` | | arrow into tray — download |
| `upload` | | arrow out of tray — upload |
| `open` | `external` | arrow out of box — external link |
| `sun` | | sun — light theme |
| `moon` | | crescent — dark theme |
| `lock` | | padlock — locked/frozen account |

Aliases (`devices`, `gear`, `pencil`, `trash`, `clock`, `external`) point at the
same geometry as their base icon and exist so call sites can use the name that
reads best. Prefer the base names in new code.

## Usage on the web

Three equivalent forms ship with the set (`web-icons/` in the Ace ID repository):

**1. JS module** — renders an SVG string, drop it in place of an existing inline
SVG or image. Display screens stay layout-compatible: the markup around the icon
does not change.

```js
import { icon } from './ace-icons.js';

button.innerHTML = icon('shield-check', { title: 'Verified' }) + ' Verified';
// classic scripts: window.AceIcons.icon('shield-check')
```

**2. SVG sprite** — one request for the whole set, referenced with `<use>`:

```html
<svg width="24" height="24" aria-hidden="true"><use href="/icons/ace-icons.svg#i-shield-check"/></svg>
```

**3. Standalone files** — `icons/<name>.svg` for `<img>` tags or favicon-style
use. These carry a `#111111` stroke; use the sprite or module when you need
theming.

### Accessibility

- Decorative icons (next to a visible text label) get `aria-hidden="true"` —
  `icon()` does this by default.
- An icon that carries meaning alone passes `title` (module) or an
  `aria-label` on its control.

### Keeping display screens compatible

The set is designed to be a drop-in swap on existing screens (profile, security,
devices, connected apps):

- Every icon renders in a fixed `24 × 24` box, so replacing an old 24px icon
  causes no layout shift.
- Stroke sits inside the `3.5` safe margin — no clipping at small sizes.
- Names map 1:1 to the Android set, so screen code can keep its current
  `icon('...')` calls with only the file import changing.

## Usage on Android

The same geometry is defined in
`mobile/app/src/main/kotlin/app/tab/aid/ui/components/Components.kt` as
`AceIcons` (e.g. `AceIcons.ShieldCheck`), stroke-tinted by the Compose theme.
`AceIconsTest` guards the invariants (24dp viewport, non-empty paths, alias
identity).

## Source of truth & regeneration

`AceIcons` in `Components.kt` is the master copy. The web files are generated
from it — never edit `web-icons/*.svg` / `ace-icons.js` by hand:

```bash
python3 web-icons/generate.py
```

The generator reads the Kotlin path DSL (`moveTo`/`lineTo`/`quadTo`/`cubicTo`/
`close`) and emits identical SVG path data, so the two platforms cannot drift.
