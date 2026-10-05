# Color Shift style guide (iPhone)

Matt D. Smith's Color Shift visual language, measured from his web code (`~/Desktop/GitHub/mds-color-shift`, read 2026-10-04) and translated to SwiftUI. Web px map 1:1 to iOS pt. Where a value comes from a file, the file is named so it can be re-checked.

The one deliberate departure is that **the top and bottom bars are Liquid Glass** instead of Matt's solid black. Everything else follows him.

---

## 1. Principles

1. **The two colors are the content.** All chrome is quiet and near-black or glass, with small gray monospace labels, so nothing competes with the pair.
2. **Small, precise, monospace.** One UI typeface, uppercase hex, tight spacing, 4 pt corners.
3. **Motion explains change.** Every value change animates: letters roll, colors crossfade, grips glide. Nothing jumps.
4. **Vertical panels, horizontal photos.** Panels open and close along the vertical axis. Only the photo filmstrip moves sideways.

## 2. Color tokens (chrome)

From `src/app/globals.css`. These match Shift Nudge's dark scale.

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#0f0e0f` | App background behind everything, and the fallback behind the glass |
| `surface` | `#1a1718` | Raised areas (rarely needed) |
| `surfaceRaised` | `#212121` | Selected or pressed button fill |
| `stroke` | `#303030` | 1 pt inset border on selected buttons |
| `border` | `#1b191a` | Hairlines |
| `textRest` | `#a39f9f` | Labels, values and icons at rest |
| `textSelected` | `#e5e0e0` | Labels and icons when selected |

The user's two colors are never tokens. They come from state.

## 3. Typography

| Role | Font | Size | Details | Source |
|---|---|---|---|---|
| All UI labels (hex, score, tabs, slider labels and values) | **Input Mono** Regular | **14 pt** (Matt's phone bars force 14 px) | Leading 1.0, no wrapping. Values use tabular figures. Hex in capitals without `#` | `control-container.tsx`, `cs-button.tsx` |
| Photo credit | Input Mono Regular | 10 pt | White at 70%, slight drop shadow | `strip-transition.tsx` |
| Specimen "Aa" | **Instrument Serif** Regular | Auto-fit: as large as fits the color half with padding | Tracking tight (−0.025 em), line height 1.05, centered | `strip-transition.tsx` |

**Fonts:**
- **Instrument Serif** is OFL, so bundling it is fine.
- **Input Mono** is in Matt's repo (`src/fonts/InputMono-Regular.woff2`). Its licence is free for private use, which covers a portfolio app on the owner's phone. Check the licence before any public distribution.
- iOS needs `.ttf` or `.otf` files, not `.woff2`.

## 4. Shapes and sizes

| Element | Spec | Source |
|---|---|---|
| Button (hex swatch button, score pill) | Visual height about 28 pt (8 pt padding plus a 12–14 pt line), **4 pt corner radius**, 8 pt gap between swatch and label. **Touch area at least 44 × 44 pt** | `cs-button.tsx`, Figma `button` |
| Selected button | Fill `surfaceRaised` with a 1 pt inset `stroke`. Label `textSelected` | `cs-button.tsx` |
| Swatch chip | **12 × 12 pt**, 2 pt radius, 1 pt inset stroke: white 10% on dark colors, black 10% on light (dark means BT.601 luma below 128, Matt's `isHexDark`) | `swatch.tsx` |
| Slider track | **8 pt tall**, fully rounded, 4 pt inset from each end. 1 pt inner stroke of white 10% when the track's ends are very dark (luma below 40) | `color-slider.tsx` |
| Slider grip at rest | **10 pt** white dot with a 1 pt black 20% outline | `color-slider.tsx` |
| Slider grip while dragging | Grows to **24 pt**, white 35% fill, 3 pt background blur. Shadows: inner 1 pt white 15% highlight and outer 0/1/3 black 20% | `color-slider.tsx` |
| Slider row | Track (24 pt touch row), then a 4 pt gap, then label (left) and value (right) | `color-slider.tsx` |
| Circle (toggle) | Solid text color, diameter **50% of the color half's height** | Matt's pre-May-2026 `strip-transition.tsx` (commit `09875b0`). It's removed from his current code |

## 5. Spacing and layout

From `control-container.tsx` (the phone layout).

- **Bars:** 16 pt padding on all sides. The bottom bar also clears the home indicator (safe area).
- **Top bar:** the score pill on the left. Nothing else, since export is out of scope.
- **Bottom bar:**
  - text-color button on the left, background-color button on the right;
  - the middle stays empty now that swap is cut. Don't stretch the buttons to fill it.
- **Slider panel** (opens above the bottom bar, inside the glass):
  - tabs row: OKLCH / HSB / RGB, spread across the full width;
  - 16 pt gap, then the three sliders with 12 pt between them;
  - 16 pt gap, then the swatch row.
- **Middle:** the color half on top, the photo half below (v2), split 50/50 between the bars. In v1, the color fills the whole middle (assumed in APP-SPEC).

## 6. Liquid Glass (the iOS layer)

- **Only two things are glass:** the top bar and the bottom bar, including the slider panel when it's open. Use `.glassEffect(.regular, in: .rect(cornerRadius: …))`. The glass APIs need iOS 26, which is the target.
- **The bars span the full width,** edge to edge as in Matt's layout. The color and photo run underneath the glass to the screen edges, so the glass picks up the live colors.
- **Legibility (test, don't assume):** Matt's grays were tuned for solid `#0f0e0f`.
  - Over glass on a very light color, `#a39f9f` may fall below a 4.5:1 contrast ratio.
  - Check every label over pure white (`#FFFFFF`) and pure black (`#000000`) under the glass.
  - If a label fails, keep Input Mono and the two-level system, but switch the label to the system's vibrant label colors on glass. Write down the choice here.
- **Accessibility:** glass adapts to Reduce Transparency and Increase Contrast by itself. Our own animations must check Reduce Motion themselves.

## 7. Motion

Translate Matt's GSAP and CSS curves with `.timingCurve(x1, y1, x2, y2, duration:)`.

| Motion | Duration | Curve | Source |
|---|---|---|---|
| Background and text color crossfade (new photo or pair) | 0.5 s | power2.out = `timingCurve(0.33, 1, 0.68, 1)` | `strip-transition.tsx` |
| Photo filmstrip slide (commit after a 20% drag, or arrows) | 0.5 s | power3.inOut | `strip-transition.tsx` |
| Panel open/close (slider panel): height 0 → full, content moves from −8 pt to 0 and fades in | 0.3 s | power4.out = `timingCurve(0.07, 1, 0.33, 1)` | `control-container.tsx` YPanel, DialKit defaults |
| Slider grips gliding on a tab switch | 0.2 s | power4.out | `color-shift.tsx` `animateSlidersTo` |
| Gradient track crossfade on a tab switch | 0.2 s | `timingCurve(0.23, 1, 0.32, 1)` | `color-slider.tsx` |
| Grip swell or shrink | 0.25 s | `timingCurve(0.23, 1, 0.32, 1)` | `color-slider.tsx` |
| **Rolling letters** (labels changing) | Old characters flip up (rotateX 0 → 90°, fade), 0.1 s each, 0.01 s stagger, power2.in. Then the width eases to the new text, 0.2 s power2.out. Then new characters flip in from −90°, 0.1 s each, 0.01 s stagger, power2.out | as listed | `tube-text.tsx` |
| **"Aa" ↔ circle** | 0.3 s | power4.out: the outgoing shape scales to 0 and fades, the incoming one scales from 0 to 1 | Matt's April 2026 version (DialKit "color click" defaults). Removed from his current code, so confirm it's wanted |
| Button press | Down: scale 0.95 in 0.05 s. Release: back to 1 with a small pop, 0.2 s `timingCurve(0.23, 1, 0.32, 1)` | as listed | `globals.css` |
| Color-half press (before the toggle) | Scale 0.97, 0.1 s ease-out | | `strip-transition.tsx` |

**Reduce Motion:** rolling letters, slides, the toggle and the grip swell become 0.2 s opacity fades. Colors still crossfade, since that conveys information, not decoration.

## 8. Haptics

- Use `.sensoryFeedback(.impact(weight: .light), trigger:)`.
- **When:**
  - a slider drag crosses a WCAG level (3, 4.5 or 7), in either direction;
  - the photo changes;
  - any button is pressed;
  - a pull-to-refresh produces a new pair or photo.
- Nothing else. No haptics on every slider tick.

## 9. Icons

Matt's icons are 24 pt line icons, stroke 1.5, using the current text color (`icons.tsx`). The app needs very few:
- left and right arrows, if photo arrows are shown;
- an "i" for the info screen in v3, drawn in the same style.

Don't mix in filled SF Symbols.
