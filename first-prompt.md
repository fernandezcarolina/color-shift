# First prompt: Color Shift for iPhone, version 1

Paste everything below the line into a fresh Claude Code session started in `~/Desktop/GitHub/color-shift`.

---

## Build

Build **version 1** of Color Shift for iPhone: a native SwiftUI adaptation of Matt D. Smith's Color Shift web tool. Version 1 is **colors and score only**:
- the app opens on a random harmonious color pair;
- pull down for a new pair;
- tap a swatch to edit that color with OKLCH, HSB or RGB sliders;
- watch the WCAG contrast score update live.

No photos, no network.

The full product is in `APP-SPEC.md` and the visual language in `COLOR-SHIFT-STYLE-GUIDE.md`, both in this repo. **Read both completely before anything else.** They win over anything in this prompt.

**Work in this order, and stop at each checkpoint:**

1. **Read** `APP-SPEC.md`, `COLOR-SHIFT-STYLE-GUIDE.md`, Matt's `~/Desktop/GitHub/mds-color-shift/src/lib/color-engine.ts`, and the slider helpers (`colorToPercent`, `percentToActual`, `actualToHex`) plus the slider-config section of `.../src/components/color-shift.tsx`.
2. **Checkpoint 1:** reply with a short plan in plain language: the screens, the Swift files, the test approach and the order of tasks. List any questions. **Ask the owner about every item marked "(assumed)" or "Confirm" in APP-SPEC.md** before it's built. **Wait for approval.**
3. **Reference answers:** write a small script in `tools/` (in this repo) that imports Matt's `color-engine.ts` from his repo and writes `Tests/Fixtures/reference.json`. It should cover hex → all formats, `maxChroma`, slider percent ↔ value round-trips for all three modes, WCAG ratio and grade, and harmony-generator ranges. Use about 200 varied colors, including black, white, pure primaries and near-greys.
   - **Checkpoint 2:** running it executes Matt's code, which this environment blocks by default. Show the owner the exact command and ask them to run it or approve it.
4. Build the Swift color engine against those fixtures until every case matches. Then build the UI.
5. **Checkpoint 3:** after each visible milestone (layout, sliders, score, motion), take simulator screenshots, look at them yourself, and show the owner before moving on.

## Content

What version 1 shows (details in APP-SPEC.md → Content):
- **Top Liquid Glass bar:** the score pill, with grade (AAA / AA / AA Large / Fail) and ratio (`4.52:1`).
- **Middle:** the background color fills the space between the bars, with a large Instrument Serif **"Aa"** in the text color. Tap it to toggle to a solid circle, but **only if the owner confirms at checkpoint 1**: Matt removed that toggle in May 2026.
- **Bottom Liquid Glass bar:**
  - text-color button (left) and background-color button (right), each a 12 pt swatch with the hex in capitals and no `#`;
  - tapping one opens the slider panel above it: OKLCH / HSB / RGB tabs and three gradient sliders with labels and values.

## Constraints

- **Platform:** iPhone, portrait only, **iOS 26.0+**, Xcode 27, Swift 6, SwiftUI. Test target uses Swift Testing.
- **Project:** generate the Xcode project with **XcodeGen** from a committed `project.yml` (`brew install xcodegen` if missing). Don't commit the `.xcodeproj`.
  - App target `ColorShift`.
  - Bundle ID `com.fernandezcarolina.colorshift`.
  - Display name "Color Shift".
- **Build and test command:**
  ```sh
  xcodegen generate && xcodebuild -project ColorShift.xcodeproj -scheme ColorShift \
    -destination 'platform=iOS Simulator,name=iPhone 18 Pro' CODE_SIGNING_ALLOWED=NO build test
  ```
  Only iOS 27 simulators are installed.
- **Color math must match Matt's output exactly** for every fixture: hex, rounded values, ratio to 2 decimal places, grade. Port his algorithms rather than using Apple color APIs:
  - culori-equivalent conversions;
  - `maxChroma`'s 30-step binary search and cache quantization;
  - `isHexDark` BT.601 luma;
  - `generateRandomPair` ranges.
- **Fonts:**
  - Instrument Serif: OFL, from `google/fonts` (`ofl/instrumentserif`).
  - Input Mono Regular: Matt has only `.woff2`. iOS needs `.ttf` or `.otf`. Ask the owner how to get it (Input's licence is free for private use).
- **No network code, no Unsplash and no Vercel in version 1.** No persistence: every launch is a fresh random pair.
- **Git:** commit in small steps on a branch and open a PR to `main` on `fernandezcarolina/color-shift`. The owner merges.
- **The owner is a designer new to the command line.** Explain things in plain language. Give any command they must run one at a time, without quotes where possible.

## Style

Follow `COLOR-SHIFT-STYLE-GUIDE.md` exactly. Use its tokens, sizes and timing curves; don't eyeball them. The key points:
- Matt's near-black chrome tokens and the two grays (`#a39f9f` / `#e5e0e0`);
- Input Mono 14 pt for every UI label;
- 4 pt corners;
- 8 pt slider tracks, with a 10 pt grip that grows to 24 pt;
- **Liquid Glass only on the two bars.**

Run the guide's legibility test (labels over pure white and pure black under the glass). Record the result in the guide.

## Behavior

Version 1 rows from APP-SPEC.md → Behavior:

| Action | Result |
|---|---|
| Launch | Random harmonious pair (port of `generateRandomPair`); colors ease in over 0.5 s |
| Pull down on the color area | New random pair, crossfaded over 0.5 s, with a light haptic |
| Tap a swatch | Slider panel opens above the bar (vertical, 0.3 s). Same swatch closes it, the other switches target |
| Switch tab | Grips glide (0.2 s power4.out) and gradients crossfade |
| Drag a slider | Live color, grip swells; OKLCH chroma clamped to the screen's color range |
| Slider crosses WCAG 3 / 4.5 / 7 | Light haptic |
| Score or hex changes | Rolling-letter animation |
| Tap the score | Nothing, unless the owner decides otherwise at checkpoint 1 |
| Reduce Motion on | Decorative motion becomes 0.2 s fades; colors still crossfade |

## Avoid

- **Starting version 2.** No photo half, no `URLSession`, no Unsplash, no Vercel function, even as "scaffolding".
- **Editing or running anything in `~/Desktop/GitHub/mds-color-shift`** beyond reading files. The only exception is the one approved fixture script at checkpoint 2, and its output goes to *this* repo.
- **Writing the Swift engine before the fixtures exist,** then calling it "close enough". Tests come from Matt's real outputs, not from expected values you calculate yourself.
- **Using `UIColor`/`Color` conversions, `Color.resolve` or third-party color packages** for the math. They round differently from culori.
- **SwiftUI defaults that break Matt's look:**
  - system `Slider`;
  - `NavigationStack` or titles;
  - SF Pro labels;
  - accent-blue tint;
  - `TabView` page dots;
  - `List` or `Form`.
- **Glass on content:** the color area, "Aa", circle, swatches and slider tracks are never glass.
- **28 pt touch targets.** Keep Matt's 28 pt look, but every tappable thing needs at least a 44 × 44 pt touch area.
- **Building any "(assumed)" or "Confirm" item from APP-SPEC.md before the owner answers.**
- **Committing straight to `main`,** or committing secrets or `.xcodeproj` files.
