## Purpose

Gives the app a light and a dark color theme. The first visit follows the user's system preference, and a toggle lets the user switch themes. The choice is kept across visits.

## ADDED Requirements

### Requirement: Light and dark themes
The system SHALL provide a light theme and a dark theme. Every visible UI element, including the background, text, inputs, buttons, checkboxes, list items, focus indicators, and error messages, SHALL use the active theme's colors. In both themes, body text and control labels SHALL meet WCAG 2.1 AA contrast (at least 4.5:1 for normal text), and focus indicators SHALL be visible.

#### Scenario: Dark theme applies everywhere
- **WHEN** the dark theme is active
- **THEN** the page background, text, form controls, and todo items all render in dark-theme colors, with no light-theme colors left over

#### Scenario: Contrast in both themes
- **WHEN** either theme is active
- **THEN** normal text has a contrast ratio of at least 4.5:1 against its background

### Requirement: Default to the system preference
When the user has not chosen a theme, the system SHALL use the dark theme if the operating system or browser reports a dark color-scheme preference, and the light theme otherwise.

#### Scenario: System prefers dark
- **WHEN** a first-time visitor's browser reports `prefers-color-scheme: dark`
- **THEN** the page renders in the dark theme

#### Scenario: System prefers light or has no preference
- **WHEN** a first-time visitor's browser reports a light preference or none
- **THEN** the page renders in the light theme

### Requirement: Theme toggle
The page SHALL show a theme toggle button. Activating it SHALL switch between the light and dark themes immediately, without a page reload. The button's accessible name SHALL describe the action, for example "Switch to dark theme" when the light theme is active and "Switch to light theme" when the dark theme is active. The button SHALL be operable by keyboard.

#### Scenario: Switch from light to dark
- **WHEN** the light theme is active and the user activates the toggle
- **THEN** the dark theme is applied and the toggle's accessible name becomes "Switch to light theme"

#### Scenario: Keyboard activation
- **WHEN** the toggle has keyboard focus and the user presses Enter or Space
- **THEN** the theme switches

### Requirement: Remember the chosen theme
Once the user has used the toggle, the system SHALL store the chosen theme in the browser's local storage. On later visits, the stored choice SHALL be used instead of the system preference. The stored theme SHALL be applied before the page first paints, so the other theme never flashes. If storage is unavailable or holds an unrecognized value, the system SHALL fall back to the system preference.

#### Scenario: Choice survives reload
- **WHEN** the system prefers light, the user switches to dark, and reloads the page
- **THEN** the page renders in the dark theme from the first paint

#### Scenario: Stored choice overrides system preference
- **WHEN** the stored theme is "light" and the browser reports `prefers-color-scheme: dark`
- **THEN** the page renders in the light theme

#### Scenario: Invalid stored value
- **WHEN** the stored theme value is not "light" or "dark"
- **THEN** the system uses the system preference
