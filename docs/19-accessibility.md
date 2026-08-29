# Accessibility

Target WCAG 2.2 AA principles adapted to native mobile, plus Apple/Android platform guidance.

- Prefer 48×48 dp interactive regions; never below 44×44 pt, with adequate separation.
- Every icon-only control has an accessible name and role; decorative images are hidden.
- Screen titles/headings and traversal order match visual hierarchy. Move focus to errors/modal headings and restore it on dismissal.
- Announce matching, upload, completion, error, and offline status without excessive live-region chatter.
- Support at least 200% text. Layouts scroll/reflow; instructions, buttons, and XP values do not clip or overlap.
- Text/essential icons meet 4.5:1 contrast (3:1 for large text); components/focus indicators meet 3:1. Validate both themes.
- Never encode category, status, selection, difficulty, or error solely with color; pair text, icon, shape, or checkmark.
- Forms use persistent labels, hints, correct input traits, specific inline errors, and an error summary when useful.
- Bottom tabs expose selected state and labels. Back behavior is predictable; modals trap focus appropriately.
- Reduced-motion setting replaces matching/celebration animation with static/fade feedback. No flashing content.
- Proof image has a meaningful generic label or user note; proof is not required to have typed visual description in MVP.
- Quest metadata states physical demand and known access limitations without inferring disability. Do not label a location “accessible” without reliable data.
- Map/location actions have textual address/area alternatives; denied permissions remain a supported flow.
- Haptics and sound are supplementary and respect OS settings.

## Verification

Automated lint/a11y assertions support but do not replace manual checks. Test VoiceOver and TalkBack core loops, switch/keyboard traversal where available, 200% text, reduced motion, grayscale/color-vision simulation, dark mode, and one-handed reach. P0 failures block release.
