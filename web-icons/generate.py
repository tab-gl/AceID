#!/usr/bin/env python3
"""Generate the web icon set from the Android AceIcons source of truth.

Parses mobile/app/src/main/kotlin/app/tab/aid/ui/components/Components.kt and
emits web-icons/ (SVG sprite, per-icon SVGs, JS module, preview page) with
geometry identical to the Compose ImageVector set: 24x24 viewport, 1.8 stroke,
square caps, miter joins.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KOTLIN = os.path.join(
    ROOT,
    "mobile/app/src/main/kotlin/app/tab/aid/ui/components/Components.kt",
)
OUT = os.path.join(ROOT, "web-icons")

NUM = r"-?\d+(?:\.\d+)?f?"


def num(tok: str) -> str:
    tok = tok.strip()
    if tok.endswith("f"):
        tok = tok[:-1]
    # trim trailing .0 for compactness
    if tok.endswith(".0"):
        tok = tok[:-2]
    return tok


def dsl_to_svg(dsl: str) -> str:
    """Convert Compose PathBuilder calls to an SVG path data string."""
    out = []
    for stmt in [s.strip() for s in dsl.split(";") if s.strip()]:
        m = re.match(r"(\w+)\((.*)\)\s*$", stmt)
        if not m:
            if stmt == "close()":
                out.append("Z")
                continue
            raise ValueError(f"unparsed statement: {stmt!r}")
        fn, args = m.group(1), [a.strip() for a in m.group(2).split(",")]
        if fn == "close":
            out.append("Z")
        elif fn == "moveTo":
            out.append(f"M {num(args[0])} {num(args[1])}")
        elif fn == "lineTo":
            out.append(f"L {num(args[0])} {num(args[1])}")
        elif fn == "quadTo":
            out.append(f"Q {num(args[0])} {num(args[1])} {num(args[2])} {num(args[3])}")
        elif fn == "cubicTo":
            out.append(
                f"C {num(args[0])} {num(args[1])} {num(args[2])} "
                f"{num(args[3])} {num(args[4])} {num(args[5])}"
            )
        else:
            raise ValueError(f"unknown fn: {fn}")
    return " ".join(out)


def parse_kotlin(src: str):
    """Return (icons: {name: svg_d}, aliases: {name: base_name})."""
    icons, aliases = {}, {}
    # icon definitions: val X = icon("AceX") { line { ... } }
    for m in re.finditer(
        r"val (\w+)\s*=\s*icon\(\"(\w+)\"\)\s*\{\s*line\s*\{(.*?)\}\s*\}",
        src,
        re.S,
    ):
        name, _vec_name, dsl = m.group(1), m.group(2), m.group(3)
        icons[name] = dsl_to_svg(dsl)
    # aliases: val Devices = Computer
    for m in re.finditer(r"val (\w+)\s*=\s*(\w+)\s*$", src, re.M):
        name, base = m.group(1), m.group(2)
        if base in icons and name not in icons:
            aliases[name] = base
    return icons, aliases


def kebab(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower()


def main():
    src = open(KOTLIN).read()
    icons, aliases = parse_kotlin(src)
    if len(icons) < 30:
        sys.exit(f"parse failed: only {len(icons)} icons found")

    all_names = dict(icons)  # name -> d (aliases added below)
    for a, base in aliases.items():
        all_names[a] = icons[base]

    os.makedirs(os.path.join(OUT, "icons"), exist_ok=True)

    # ---- SVG sprite ----
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!-- Ace ID outline icon set. Generated from the Android AceIcons source',
        "     (mobile/app/src/main/kotlin/app/tab/aid/ui/components/Components.kt).",
        "     24x24 viewport, stroke 1.8, square caps, miter joins. Tint with CSS",
        "     `color` (stroke uses currentColor). -->",
        '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">',
    ]
    for name, d in sorted(all_names.items(), key=lambda kv: kv[0].lower()):
        sid = "i-" + kebab(name)
        parts.append(
            f'  <symbol id="{sid}" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="1.8" '
            f'stroke-linecap="square" stroke-linejoin="miter">'
            f'<path d="{d}"/></symbol>'
        )
    parts.append("</svg>")
    open(os.path.join(OUT, "ace-icons.svg"), "w").write("\n".join(parts) + "\n")

    # ---- per-icon SVGs ----
    for name, d in all_names.items():
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" '
            'width="24" height="24" fill="none" stroke="#111111" '
            'stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter">'
            f'<title>{name}</title><path d="{d}"/></svg>\n'
        )
        open(os.path.join(OUT, "icons", kebab(name) + ".svg"), "w").write(svg)

    # ---- JS module ----
    lines = [
        "/* Ace ID outline icon set.",
        " * Generated from the Android AceIcons source of truth:",
        " * mobile/app/src/main/kotlin/app/tab/aid/ui/components/Components.kt",
        " * 24x24 viewport, stroke 1.8, square caps, miter joins, currentColor.",
        " *",
        " * Usage (module):   import { icon, ACE_ICONS } from './ace-icons.js'",
        " * Usage (classic):  window.AceIcons.icon('shield-check')",
        " *",
        " * `icon()` returns an SVG string sized 24x24 by default — drop it in",
        " * place of an existing inline <svg>/<img> to keep display screens",
        " * layout-compatible (no surrounding markup changes required).",
        " */",
        "",
        "export const ACE_ICONS = {",
    ]
    for name, d in sorted(all_names.items(), key=lambda kv: kv[0].lower()):
        lines.append(f"  '{kebab(name)}': '{d}',")
    lines.append("};")
    lines.append("")
    lines.append("export const ACE_ICON_ALIASES = {")
    for a, base in sorted(aliases.items(), key=lambda kv: kv[0].lower()):
        lines.append(f"  '{kebab(a)}': '{kebab(base)}',")
    lines.append("};")
    lines.append("")
    lines.append("""/** Resolve an icon name (incl. aliases) to its path data. */
export function iconPath(name) {
  const key = String(name || '').trim().toLowerCase();
  return ACE_ICONS[key] || ACE_ICONS[ACE_ICON_ALIASES[key]] || null;
}

/** True when the name is a base icon (not an alias). */
export function isBaseIcon(name) {
  const key = String(name || '').trim().toLowerCase();
  return ACE_ICON_ALIASES[key] === undefined && ACE_ICONS[key] !== undefined;
}

/**
 * Render an icon as an SVG string.
 * @param {string} name  icon name, e.g. 'shield-check' (aliases accepted)
 * @param {{size?: number, className?: string, title?: string}} [opts]
 */
export function icon(name, opts = {}) {
  const d = iconPath(name);
  if (!d) return '';
  const size = opts.size || 24;
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const title = opts.title ? `<title>${opts.title}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"${cls} aria-hidden="${opts.title ? 'false' : 'true'}">${title}<path d="${d}"/></svg>`;
}

/** Render an icon as a detached SVG DOM element. */
export function iconEl(name, opts = {}) {
  const tpl = document.createElement('template');
  tpl.innerHTML = icon(name, opts).trim();
  return tpl.content.firstElementChild;
}

// Classic-script fallback so non-module pages can use the same names.
if (typeof window !== 'undefined') {
  window.AceIcons = Object.assign(window.AceIcons || {}, {
    ACE_ICONS, ACE_ICON_ALIASES, iconPath, icon, iconEl,
  });
}
""")
    open(os.path.join(OUT, "ace-icons.js"), "w").write("\n".join(lines))

    # ---- preview page (mirrors the reference sheet: black on white) ----
    rows = [
        ["User", "Shield", "Login", "Logout", "Grid", "Home"],
        ["Key", "Link", "LinkOff", "Computer", "Settings", "Bell"],
        ["BellOff", "Mail", "Edit", "Compose", "Delete", "History"],
        ["Eye", "EyeOff", "Copy", "ClipboardCheck", "Check", "Close"],
        ["ShieldCheck", "Fingerprint", "Scan", "Open", "Refresh", "Download"],
        ["Upload", "Sun", "Moon", "Lock"],
    ]
    cells = []
    for row in rows:
        cells.append('    <div class="row">')
        for name in row:
            d = all_names.get(name, "")
            cells.append(
                f'      <div class="cell"><svg viewBox="0 0 24 24" width="40" '
                f'height="40" fill="none" stroke="#111" stroke-width="1.8" '
                f'stroke-linecap="square" stroke-linejoin="miter"><path d="{d}"/>'
                f'</svg><span>{name}</span></div>'
            )
        cells.append("    </div>")
    preview = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ace ID icon set — preview</title>
<style>
  body {{ margin: 0; background: #fff; color: #111; font: 13px/1.4 system-ui, sans-serif; }}
  h1 {{ font-weight: 600; font-size: 16px; margin: 24px; }}
  .row {{ display: flex; gap: 24px; justify-content: center; margin: 24px; flex-wrap: wrap; }}
  .cell {{ width: 72px; text-align: center; }}
  .cell svg {{ display: block; margin: 0 auto 6px; }}
  .cell span {{ color: #555; font-size: 11px; }}
</style>
</head>
<body>
<h1>Ace ID outline icon set (24×24, stroke 1.8, square caps)</h1>
{chr(10).join(cells)}
</body>
</html>
"""
    open(os.path.join(OUT, "preview.html"), "w").write(preview)

    base = len(icons)
    print(f"OK: {base} base icons, {len(aliases)} aliases -> web-icons/")


if __name__ == "__main__":
    main()
