# Design System

## Direction

SideQuest feels like a capable field companion: energetic accents, strong hierarchy, generous whitespace, crisp cards, and restrained game feedback. It avoids fantasy-game chrome, cartoon mascots, noisy gradients, and feed-like density.

## Foundations

### Typography

Use the platform/system sans initially for performance and native legibility. Roles: Display 32/38 semibold; H1 28/34 semibold; H2 22/28 semibold; Title 18/24 semibold; Body 16/24 regular; Label 14/20 medium; Caption 12/16 regular. All scale with OS settings; never lock line height so tightly that 200% text clips.

### Spacing, radius, elevation

- 4-point grid: `space-1` 4, `2` 8, `3` 12, `4` 16, `5` 20, `6` 24, `8` 32, `10` 40, `12` 48.
- Radius: small 8, medium 12, large 20, pill 999.
- Elevation: use borders/surface contrast first; only two subtle shadow levels. Android elevation and iOS shadows must visually match and remain performant.

### Semantic colors

Tokens, not raw colors in feature code:

| Token | Light intent | Dark intent |
|---|---|---|
| `bg` | warm near-white | deep charcoal-navy |
| `surface` / `surface-raised` | white / lifted | dark slate / lifted |
| `text` / `text-muted` | near-black / slate | near-white / cool gray |
| `brand` | electric indigo | brighter indigo |
| `accent` | vivid lime/teal | luminous teal |
| `success` | green | bright green |
| `warning` | amber | gold |
| `danger` | red | coral red |
| `border` / `focus` | neutral / high-contrast brand | neutral / light brand |

Concrete values are chosen and contrast-tested during Epic 0. Category colors are supplementary; every category also has text/icon.

## Components

- **Buttons:** Primary, Secondary, Tertiary, Destructive; minimum 48 dp height; loading retains label width; disabled is not conveyed by opacity alone.
- **Cards:** Quest cards emphasize title/instruction first, then fit chips, XP, and action. Entire-card tap is optional; explicit action remains.
- **Chips:** single-select filter chips with checkmark and selected label/state.
- **Inputs:** persistent label, help/error line, appropriate keyboard/autocomplete; never placeholder-only.
- **Navigation:** three-label bottom tabs; selected icon plus label; safe-area inset.
- **Progress:** level bar includes numeric text; matching uses bounded progress language, not false percentages.
- **Quest instructions:** numbered steps with generous line spacing and optional safety callout.
- **XP:** compact bolt/spark icon plus `+120 XP`; no coins/currency metaphor.
- **Feedback:** inline messages for recoverable errors; banners for offline/stale state; modal only for consequential confirmation.

## Quest categories

Use a consistent icon and optional accent: Chill (pause/leaf), Food (utensils), Explore (compass), Active (movement), Creative (spark/pencil). Random uses shuffle/dice only in the selector and is never stored as a category.

## Motion and haptics

Motion clarifies state: 150–250 ms UI transitions, one short 400–700 ms completion flourish, no infinite ornamental animation. Respect reduced motion. Haptics: light on chip selection, medium on Accept, success on confirmed completion, warning only on destructive confirmation; never rely on haptics or trigger repeatedly.

## Themes and implementation

Support system light/dark at MVP, with optional user override. Define tokens in one typed theme layer and map into NativeWind. Components must be visually tested in both themes, large text, and common color-vision conditions.
