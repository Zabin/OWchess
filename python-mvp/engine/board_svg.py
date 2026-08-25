"""
Server-rendered SVG orbital board — the Sprint-0 "simpler placeholder" visual board (the task
brief explicitly allows this over porting ZabSpaceExercise's canvas globe, which isn't available
in this environment). Three concentric rings for LEO/MEO/GEO, three 120-degree sectors per ring
for EQUATORIAL/PROGRADE/POLAR — a legible, real board (CLAUDE.md's Known Good Behavior notes the
old TypeScript build shipped with *no* board at all: unstyled flat <div> lists, no CSS anywhere).
"""
from __future__ import annotations

import math

ALTITUDE_RADIUS = {"LEO": 70, "MEO": 130, "GEO": 190}
PLANE_ANGLE_DEG = {"EQUATORIAL": -90, "PROGRADE": 30, "POLAR": 150}  # top, lower-right, lower-left
SIZE = 440
CENTER = SIZE / 2


def _regime_point(regime: str, jitter_index: int = 0) -> tuple[float, float]:
    altitude, plane = regime.split("-")
    r = ALTITUDE_RADIUS[altitude]
    base_angle = PLANE_ANGLE_DEG[plane]
    # spread multiple co-located assets across a small arc so markers don't overlap
    spread = (jitter_index % 5) * 9 - 18
    angle = math.radians(base_angle + spread)
    x = CENTER + r * math.cos(angle)
    y = CENTER + r * math.sin(angle)
    return x, y


def render_board(own_markers: list[dict], opp_markers: list[dict], unknown_count: int) -> str:
    """own_markers/opp_markers: [{regime, label, kind: 'king'|'asset', destroyed, deceived}]"""
    parts: list[str] = []
    parts.append(
        f'<svg viewBox="0 0 {SIZE} {SIZE}" width="100%" height="100%" role="img" '
        f'aria-label="Orbital board" xmlns="http://www.w3.org/2000/svg">'
    )
    parts.append(f'<rect width="{SIZE}" height="{SIZE}" fill="var(--board-bg,#0b1220)" rx="12"/>')

    # rings + sector spokes
    for altitude, r in ALTITUDE_RADIUS.items():
        parts.append(
            f'<circle cx="{CENTER}" cy="{CENTER}" r="{r}" fill="none" '
            f'stroke="#2a3a55" stroke-width="1.5" stroke-dasharray="3,4"/>'
        )
        parts.append(
            f'<text x="{CENTER + r + 4}" y="{CENTER - 4}" fill="#5b7091" font-size="10" '
            f'font-family="monospace">{altitude}</text>'
        )
    for plane, angle in PLANE_ANGLE_DEG.items():
        rad = math.radians(angle)
        x2 = CENTER + 200 * math.cos(rad)
        y2 = CENTER + 200 * math.sin(rad)
        parts.append(f'<line x1="{CENTER}" y1="{CENTER}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#1c2740" stroke-width="1"/>')
        lx = CENTER + 214 * math.cos(rad)
        ly = CENTER + 214 * math.sin(rad)
        parts.append(
            f'<text x="{lx:.1f}" y="{ly:.1f}" fill="#3c4f72" font-size="9" font-family="monospace" '
            f'text-anchor="middle">{plane[:4]}</text>'
        )

    parts.append(f'<circle cx="{CENTER}" cy="{CENTER}" r="3" fill="#4a5b7a"/>')

    def draw_group(markers: list[dict], color: str, ring_color: str) -> None:
        by_regime: dict[str, int] = {}
        for m in markers:
            idx = by_regime.get(m["regime"], 0)
            by_regime[m["regime"]] = idx + 1
            x, y = _regime_point(m["regime"], idx)
            radius = 9 if m["kind"] == "king" else 6
            fill = "#3a3f4a" if m.get("destroyed") else color
            parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{radius}" fill="{fill}" stroke="{ring_color}" stroke-width="2"/>')
            if m["kind"] == "king":
                parts.append(f'<text x="{x:.1f}" y="{y+3:.1f}" fill="#0b1220" font-size="9" text-anchor="middle" font-weight="bold">K</text>')
            if m.get("deceived"):
                parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{radius+4}" fill="none" stroke="#e0b03a" stroke-width="1.5" stroke-dasharray="2,2"/>')
            label = m["label"] if not m.get("destroyed") else f'{m["label"]} (destroyed)'
            parts.append(
                f'<text x="{x:.1f}" y="{y - radius - 5:.1f}" fill="#c9d4e8" font-size="9" '
                f'text-anchor="middle" font-family="monospace">{label}</text>'
            )

    draw_group(own_markers, "#2fb3a3", "#173b36")
    draw_group(opp_markers, "#d1495b", "#3b1720")

    if unknown_count:
        parts.append(
            f'<text x="{CENTER}" y="{SIZE-14}" fill="#7c8aa5" font-size="11" text-anchor="middle" '
            f'font-family="monospace">+{unknown_count} unresolved contact(s) (find-level only)</text>'
        )

    parts.append("</svg>")
    return "".join(parts)
