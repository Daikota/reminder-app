# Expo HAS CHANGED

Read the exact versioned Expo docs for the SDK version used by this project before writing any code. `package.json` is the source of truth for the active Expo SDK and related Expo package versions. For the current Expo 56 project, use https://docs.expo.dev/versions/v56.0.0/.

## Mobile UX, UI, and App Design Rules

These rules are mandatory for all future UI and UX decisions in this project.

### 1. Mobile-First Design

- The app is primarily developed for Android smartphones.
- Layouts must be optimized for mobile use first.
- Do not apply desktop-first assumptions to mobile screens.
- Content must remain usable and readable on small displays.

### 2. Thumb Zone and Reachability

- Place primary actions near the lower part of the screen whenever possible.
- Do not place important buttons only in hard-to-reach top corners.
- Prefer bottom actions for primary mobile workflows.
- Always account for Android system navigation, safe areas, and device insets.

### 3. Touch Targets

- Buttons and tappable elements must be large enough for touch input.
- Use touch targets of about 44x44 or 48x48 points/pixels where practical.
- Keep enough spacing between interactive elements.
- Small icons must have an additional tappable area around them.

### 4. Progressive Disclosure

- Hide optional content by default.
- Show advanced or secondary content only after the user actively opens it.
- Examples include optional notes, additional options, and rarely used settings.
- Do not overload screens with content that is not immediately needed.

### 5. Forms

- Keep mobile forms short, simple, and fast to complete.
- Use single-column form layouts.
- Provide clear spacing between fields.
- Clearly indicate required fields.
- Use appropriate keyboard types when useful.
- Forms should support quick mobile input and avoid unnecessary friction.

### 6. Lists and Scrollability

- Long content must remain scrollable.
- Do not break expected scroll behavior.
- Lists must stay clear, readable, and reasonably performant.
- Fixed footers and system bars must never cover important list content.

### 7. Visual Hierarchy

- Clearly emphasize important content and actions.
- Use whitespace and spacing generously.
- Avoid overloaded screens.
- Users must be able to immediately identify the primary action, current information, and next steps.

### 8. Accessibility

- Use strong enough contrast for text and controls.
- Keep text readable and avoid extremely small text sizes.
- Do not communicate meaning by color alone.
- Keep UI patterns broadly accessibility-friendly.

### 9. UX Rules

- Keep user flows as short as possible.
- Avoid repeated unnecessary steps.
- Allow multiple entries in one flow when that is useful.
- Do not force users through many separate screens without a good reason.
- Mobile use should feel fast, direct, and fluid.

### 10. Gestures and Hidden Interactions

- Critical functions must never be available only through gestures.
- Important actions must always have visible UI.
- Gestures may be used only as an optional enhancement.

### 11. Layout Rules

- Always consider SafeAreaView, safe-area-context insets, and mobile device insets.
- Footer buttons must never be clipped or covered.
- Prefer large bottom action areas for primary actions.
- Design layouts with smaller Android devices in mind.

### 12. UI Architecture

- Keep UI components reusable where practical.
- Prefer small, clearly separated components.
- Do not build huge screen files when a screen can be reasonably split into focused components.

## Dark Mode Architecture Rules

These rules are mandatory for future UI work so the app can support a professional Light and Dark Mode without large later refactors.

### 1. Theme Architecture

- Do not spread hardcoded colors directly across screen files.
- Manage colors centrally whenever practical, for example in `constants/theme.ts` or `constants/colors.ts`.
- New components must be structured so they can become theme-aware later.
- Prefer named semantic color tokens over raw color values in UI code.

### 2. Dark Mode Strategy

- Do not fully activate Dark Mode unless explicitly requested.
- New UI components should still be structured to be Dark-Mode-compatible.
- `useColorScheme` may be prepared or used when it is helpful and does not overcomplicate the task.
- Do not add a manual theme toggle unless explicitly requested.

### 3. Color Rules

- Avoid using pure black or pure white surfaces everywhere.
- Prefer comfortable contrast rather than harsh contrast.
- Avoid pure `#000000` where a slightly lifted dark surface works better.
- Keep dark surfaces slightly elevated and readable.
- Prioritize text readability in every color decision.

### 4. Accessibility

- Text must remain readable in both Light and Dark Mode.
- Keep contrast accessibility-friendly.
- Do not communicate meaning through color alone.
- Status, emphasis, and validation states must also have text, icons, structure, or labels when needed.

### 5. Component Rules

- Reusable components should consume theme values instead of local raw colors.
- Avoid scattered inline color values across many files.
- Import colors from a central theme source whenever the task scope allows it.
- Keep component APIs compatible with future theme changes.

### 6. UI Behavior

- Status colors for success, warning, error, and info must work in both Light and Dark Mode.
- Buttons, inputs, cards, and lists must stay clearly distinguishable in both modes.
- Disabled, pressed, focused, and error states must remain visible in both modes.

### 7. Development Rule

- For larger UI changes, check whether hardcoded colors can be avoided.
- For larger UI changes, check whether the structure remains Dark-Mode-ready.
- Do not perform large theme refactors unless explicitly requested.
- Keep theme improvements scoped to the current task unless the user asks for a broader redesign.

## Premium Mobile Product Design Rules

These rules are mandatory for all future UI and UX work so the app keeps its modern premium mobile design language.

### 1. Product Design Quality

- The app must feel like a modern premium mobile app.
- Do not let new screens fall back to a generic admin panel, dashboard, or plain form style.
- UI must remain high-quality, modern, calm, and consistent.
- New features must visually fit the existing design language before they are considered complete.

### 2. Less Text, More Visual Communication

- Avoid unnecessary explanatory text in the UI.
- Prefer clear icons when the meaning is obvious.
- Keep labels, helper text, and descriptions short.
- Screens must remain quickly scannable on small mobile displays.

### 3. Modern Mobile Look

- Preserve the modern productivity-app aesthetic.
- Avoid boring default React Native layouts.
- Do not create large rectangular blocks without visual hierarchy.
- Use subtle depth, layering, and grouped surfaces to make screens feel intentional.

### 4. Visual Hierarchy

- Primary actions must always be visually clear and easy to find.
- Secondary information must be quieter than primary content.
- Danger actions must be visually restrained and should not compete with primary actions.
- Layouts must actively guide the user's eye toward the current information and next useful step.

### 5. Component Consistency

- Buttons, cards, inputs, section headers, empty states, and list items must stay visually consistent.
- Prefer reusable components for repeated UI patterns.
- Do not introduce many slightly different variants of the same UI element.
- Extend existing shared UI components before adding one-off screen-specific patterns when practical.

### 6. Cards and Layouts

- Cards must be compact but still feel polished and touch-friendly.
- Avoid unnecessary empty space.
- Show more useful content when possible without making the screen feel overloaded.
- Keep repeated cards aligned, consistently spaced, and visually calm.

### 7. Theme Quality

- Preserve the existing theme and color language.
- Dark Mode must feel intentionally designed, not merely dark.
- Use color sparingly and purposefully.
- Reserve the accent color for important interactions, focus, and meaningful emphasis.
- Keep all new UI theme-aware and avoid scattered hardcoded colors.

### 8. Typography

- Preserve a clear modern typography hierarchy.
- Headlines should carry stronger visual weight than secondary content.
- Secondary information should be quieter and easier to scan.
- Avoid long UI text that makes screens feel like documentation.

### 9. UX Flow

- Keep user flows short and direct.
- Avoid unnecessary intermediate steps.
- Prefer multi-entry workflows when users naturally need to add several items.
- Important actions must stay easy to reach in the mobile thumb zone.

### 10. Rating and Analysis UI

- Rating screens must feel like a modern decision and comparison tool.
- Avoid pure table, spreadsheet, or plain form layouts for scoring and results.
- Results must be visually clear, ranked, and quickly understandable.
- Winners, alternatives, scores, and relative strength should be communicated visually where practical.

### 11. Animations and Interactions

- Prefer subtle modern touch feedback and press states.
- Avoid overloaded, playful, or distracting animation.
- Interactions should feel fluid, restrained, and useful.
- Critical feedback must not rely on animation alone.

### 12. Quality Check Before UI Changes

Before larger UI changes, Codex must check:

- Whether the change weakens the existing premium look.
- Whether the new UI is consistent with the existing design language.
- Whether unnecessary text is being added.
- Whether reusable components remain reusable.
- Whether the change makes the app feel more modern or more generic.

### 13. Forbidden Directions

Avoid these directions unless the user explicitly requests them:

- Generic dashboard appearance.
- Strongly technical developer-tool appearance.
- Overloaded forms.
- Too many visually identical boxes.
- Unnecessarily dominant danger buttons.
- Large empty spaces without purpose.
- Inconsistent components.
- Default React Native look.

## Studio Brand and App Ecosystem Rules

These rules are mandatory for future apps that should belong to the same studio ecosystem. They extend the app-specific rules above into a reusable studio design system.

### 1. Shared Studio Identity

- All apps must feel like products from the same modern software studio.
- Apps must be calm, high-quality, modern, and mobile-first.
- No app may feel like a generic prototype, starter project, or standard template.
- Recognition across apps must come from consistent colors, typography, layout logic, and component behavior.

### 2. Unified Design System

- All apps must use the same core logic for layouts, cards, buttons, inputs, chips, empty states, and bottom actions.
- Reusable UI components must be preferred for repeated interface patterns.
- New apps must inherit the existing design rules instead of inventing a new visual system from scratch.
- Shared component patterns should be extended deliberately rather than duplicated with small visual differences.

### 3. Shared Color Logic

- The studio accent color is `#EE8434` by default.
- Dark Mode must use this studio base unless an app-specific reason justifies a controlled variation:
  - Background: `#2C2B3C`
  - Surface/Card: `#403F4C`
  - Accent: `#EE8434`
- Light Mode must use this studio base unless an app-specific reason justifies a controlled variation:
  - Background: `#FEFDFF`
  - Surface/Card: `#8EB1C7`
  - Accent: `#EE8434`
- The accent color may only be used for true primary actions, active selections, focus states, winners, or important interactions.
- Neutral information must never look like an active selection, active filter, or primary interaction.

### 4. App-Specific Adaptation

- Each app may have its own icons, logos, content model, and specialized components.
- The shared studio visual language must remain recognizable across app-specific adaptations.
- App-specific deviations must have a clear product or usability reason.
- Do not introduce random new colors, surfaces, typography styles, or interaction patterns without a clear benefit.

### 5. Cross-App UX Philosophy

- Keep user flows short and direct.
- Avoid repeated unnecessary steps.
- Prefer less text and clearer visual communication.
- Prioritize mobile use, thumb reachability, and small-screen clarity.
- Keep important actions easy to reach.
- Use progressive disclosure for optional, advanced, or rarely used content.

### 6. Component Quality

- New components must match the existing premium look before they are considered complete.
- Do not use default React Native styling as a finished UI.
- Do not create generic dashboard layouts.
- Do not create overloaded form pages.
- Cards must stay compact, polished, and visually consistent.
- Buttons must clearly distinguish primary, secondary, ghost, and danger actions.

### 7. Long-Term Goal

- This project must serve as a foundation for a small app ecosystem.
- Each new app should be faster to build because design and UX rules are reusable.
- Codex must apply the studio rules first, then adapt them to the specific app idea.
- Shared decisions should reduce future design drift without blocking app-specific product needs.

### 8. Codex Rule for New Apps

When developing a new app, Codex must first check:

- Which existing studio rules can be reused.
- Which app-specific rules need to be added.
- Whether the new app visually belongs to the studio ecosystem.
- Whether the UI remains high-quality, modern, mobile-first, and consistent.
