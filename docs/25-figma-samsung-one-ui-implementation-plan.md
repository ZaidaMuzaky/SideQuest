# Figma → Samsung One UI implementation plan

Status: reference and rollout plan. `SQ-0104` applies the onboarding slice first.

## Design intent

Use the Figma page `SideQuest — Samsung One UI Redesign` as the visual reference for a calm, modern Android experience. The implementation keeps SideQuest product behavior, localization, safety language, server-authoritative mutations, and accessibility requirements unchanged.

## Visual system

- Primary: Samsung One UI blue `#0381FE`; pressed/strong action `#0072DE`; active control `#3E91FF`.
- Background: `#F7F7F7`; surface: `#FFFFFF`; soft selected surface: `#EDF2FF`.
- Main text: near-black; secondary text: dark gray; borders: `#E5E5E5`.
- Use one prominent button style per screen. Reserve color for action, selection, focus, and status.
- Use editable SVG symbols for Quest, search, compass, progress, location, completion, and navigation. Avoid decorative raster images unless they communicate Quest content and are measured for size.

## Information architecture

The intended user flow is Home/Today → Discover → Quest Detail → Active Quest → Progress. Onboarding remains a short three-step setup before Explore:

1. Mood and discovery intent.
2. Time and budget.
3. Distance, age eligibility, and save.

Each screen should separate a generous viewing area from the lower interaction area, keep the primary action reachable, preserve a stable bottom navigation model, and show loading, empty, error, offline, permission, and large-text states.

## Rollout sequence

1. `SQ-0104`: apply the visual system and clearer step hierarchy to onboarding without changing its data contract or save RPC.
2. Discovery: align Explore filters and Candidate presentation with the Figma flow while preserving matching rules.
3. Execution: align Active Quest and proof actions with the same action hierarchy and safety emphasis.
4. Progress: align Profile, History, and completion feedback.
5. Replace remaining placeholder glyphs with the shared SVG icon set and run contrast/accessibility checks on light and dark themes.

## Performance and size guardrails

- Keep SVGs local and optimized; do not add an icon library for a handful of symbols.
- Do not embed screenshots or Figma exports in the app bundle.
- Keep proof/avatar normalization bounded and lazy-load non-critical media behavior.
- Measure release APK/AAB download and installed size before and after rollout; target remains under 50 MB.
- Verify low-end Android scrolling, touch response, reduced motion, and 200% text before each screen ships.

## Acceptance mapping

- `SQ-0104`, `AC-ONB-001`, `FR-ONB-001`, `FR-AGE-001`: onboarding flow and idempotent save.
- `FR-I18N-001`: no new user-facing strings are hardcoded in screens.
- `AC-ACC-001`: readable contrast, screen-reader labels, touch targets, dynamic text, and reduced motion.
- `AC-REL-001`: failed saves preserve selections and expose retry.

## References

- Samsung One UI color system: https://developer.samsung.com/one-ui/color/system.html
- Samsung One UI layout: https://developer.samsung.com/one-ui/layout/basic.html
- Samsung One UI buttons: https://developer.samsung.com/one-ui/comp/button.html
- Samsung One UI contrast: https://developer.samsung.com/one-ui/accessibility/color-contrast.html
- Figma source: `SideQuest — Samsung One UI Redesign`
