# Spec Delta

## Purpose

Keeps ApplyFlow's look and interaction states consistent and accessible across every page, so new screens reuse shared tokens instead of one-off styles.

## ADDED Requirements

### Requirement: Shared design tokens
Colours, font sizes, spacing, corner radii and shadows used across the app SHALL come from a single shared set of named tokens.

#### Scenario: New component
- **WHEN** a component needs a text size, gap or colour
- **THEN** it uses a shared token, and no new hard-coded hex colour is introduced outside the token definitions

### Requirement: Readable typography
The app SHALL use a dedicated interface font loaded with the app (not the browser default Arial), with a defined type scale for page titles, section titles, body and small text.

#### Scenario: Font loading
- **WHEN** any page loads
- **THEN** text renders in the app font with a system-font fallback, and the page does not shift noticeably when the font arrives

### Requirement: Visible keyboard focus
Every interactive element SHALL show a clearly visible focus indicator when reached by keyboard.

#### Scenario: Tabbing through the dashboard
- **WHEN** the user tabs through the dashboard links, filters, search box and buttons
- **THEN** each focused element shows a visible focus ring with at least 3:1 contrast against its background

### Requirement: Accessible contrast
Body text SHALL meet a 4.5:1 contrast ratio, and large text and UI component boundaries SHALL meet 3:1.

#### Scenario: Muted helper text
- **WHEN** muted helper text appears on the page or card background
- **THEN** it meets 4.5:1 contrast

### Requirement: Consistent control states
Buttons, links, inputs and filter chips SHALL have consistent default, hover, active, disabled and loading states across the app. Destructive or irreversible actions such as sending SHALL be visually distinct from routine actions.

#### Scenario: Disabled send
- **WHEN** the send button is disabled because a requirement is missing
- **THEN** it looks disabled, cannot be activated, and the reason is shown next to it

#### Scenario: Send stands out
- **WHEN** the send step is shown
- **THEN** the send action uses the distinct send style, not the routine button style

### Requirement: Reduced motion respected
Animations and transitions SHALL be minimised when the user's system asks for reduced motion.

#### Scenario: Reduced motion on
- **WHEN** the operating system's reduce-motion setting is on
- **THEN** stepper, toast and accordion transitions happen instantly or with minimal fade
