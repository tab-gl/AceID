# Ace ID web icon set

Web build of the Ace ID outline icons, generated from the Android `AceIcons`
source of truth
(`mobile/app/src/main/kotlin/app/tab/aid/ui/components/Components.kt`).

Geometry: 24×24 viewport, 1.8 stroke, square caps, miter joins, 3.5 safe
margin, `currentColor` theming. 34 base icons + 6 aliases
(`devices`, `gear`, `pencil`, `trash`, `clock`, `external`).

## Files

| File | Purpose |
| --- | --- |
| `ace-icons.js` | ES module (also sets `window.AceIcons`): `icon(name, opts)` → SVG string, `iconEl(name, opts)` → DOM node, `iconPath(name)`, `ACE_ICONS`, `ACE_ICON_ALIASES` |
| `ace-icons.svg` | Sprite of `<symbol id="i-{name}">` for `<use href>` |
| `icons/*.svg` | Standalone 24px SVGs (fixed `#111111` stroke) |
| `preview.html` | Black-on-white contact sheet — open in a browser to eyeball the set |
| `generate.py` | Regenerates everything above from the Kotlin source |

## Dropping into the web client

Keep the display screens compatible — swap icons in place, do not restructure
the screens:

```js
import { icon } from '/js/ace-icons.js';

// replace an existing icon node/placeholder; surrounding markup unchanged
slot.innerHTML = icon('shield-check', { title: 'Verified' });
```

```html
<svg width="24" height="24" aria-hidden="true"><use href="/icons/ace-icons.svg#i-grid"/></svg>
```

- Default size 24×24 matches the previous icon boxes — no layout shifts.
- Decorative icons: leave `aria-hidden` (default). Meaningful standalone icons:
  pass `title`.
- Theme with CSS `color` (the sprite/module stroke is `currentColor`).

## Regenerating

```bash
python3 web-icons/generate.py
```

Run after any change to `AceIcons`, then review `preview.html`.
