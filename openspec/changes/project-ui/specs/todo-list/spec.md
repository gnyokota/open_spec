## Purpose

Lets a user record things to do, each with an optional date, see them as a list, and mark them complete. The list is kept across page reloads in the same browser.

## ADDED Requirements

### Requirement: Todo entry form
The home page SHALL show a form with a text input labelled "Todo", a date input labelled "Date", and a submit button labelled "Add". The text input SHALL be required. The date input SHALL be optional.

#### Scenario: Form is visible on load
- **WHEN** a user opens the home page
- **THEN** the page shows the "Todo" text input, the "Date" date input, and the "Add" button

### Requirement: Add a todo
When the form is submitted with non-blank text, the system SHALL add a new todo to the end of the list. The todo's text is the input with leading and trailing whitespace trimmed. Its date is the selected date, or no date if none was selected. A new todo SHALL start unchecked. After a successful add, the system SHALL clear both inputs and move focus back to the text input.

#### Scenario: Add a todo with a date
- **WHEN** the user types "Buy milk", selects the date 2026-10-20, and activates "Add"
- **THEN** a todo with the text "Buy milk" and the date 2026-10-20 appears at the end of the list, unchecked
- **AND** both inputs are empty and the text input has focus

#### Scenario: Add a todo without a date
- **WHEN** the user types "Call mom", leaves the date empty, and presses Enter
- **THEN** a todo with the text "Call mom" and no date appears at the end of the list

#### Scenario: Surrounding whitespace is trimmed
- **WHEN** the user submits "  Pay rent  "
- **THEN** the new todo's text is "Pay rent"

### Requirement: Reject blank todos
The system SHALL NOT add a todo when the trimmed text is empty. The list SHALL stay unchanged, the inputs SHALL keep their values, and the text input SHALL be marked invalid (`aria-invalid="true"`) with an error message announced to assistive technology.

#### Scenario: Submitting whitespace only
- **WHEN** the user enters "   " in the text input and activates "Add"
- **THEN** no todo is added
- **AND** the text input is marked invalid and the message "Enter a todo" is shown

#### Scenario: Error clears when typing
- **WHEN** the blank-todo error is shown and the user types a character into the text input
- **THEN** the error message disappears and the input is no longer marked invalid

### Requirement: Todo list display
The system SHALL show all todos in the order they were added. Each item SHALL show its text and, if it has one, its date in the user's locale's medium date format (for example "Oct 20, 2026" in en-US). The displayed calendar day SHALL be the same as the day selected, in any time zone. When there are no todos, the system SHALL show the message "No todos yet".

#### Scenario: Items appear in insertion order
- **WHEN** the user adds "First" and then "Second"
- **THEN** "First" is listed above "Second"

#### Scenario: Date shown as selected day
- **WHEN** a todo is added with the date 2026-10-20 while the browser's time zone is UTC−10 or UTC+14
- **THEN** the item displays October 20, 2026

#### Scenario: Todo without a date
- **WHEN** a todo has no date
- **THEN** its item shows only the text, with no date placeholder

#### Scenario: Empty list
- **WHEN** there are no todos
- **THEN** the message "No todos yet" is shown in place of the list

### Requirement: Complete a todo with a checkbox
Each todo item SHALL have a checkbox whose accessible name includes the todo's text (for example "Mark Buy milk as done"). When the checkbox is checked, the todo's text SHALL be shown with a strike-through. When it is unchecked, the strike-through SHALL be removed. The checkbox SHALL be operable by mouse, touch, and keyboard (Space).

#### Scenario: Checking strikes through the text
- **WHEN** the user checks the checkbox of "Buy milk"
- **THEN** the checkbox is checked and "Buy milk" is displayed with a line through it

#### Scenario: Unchecking restores the text
- **WHEN** the user unchecks a checked todo's checkbox
- **THEN** the strike-through is removed

#### Scenario: Keyboard toggle
- **WHEN** a todo's checkbox has keyboard focus and the user presses Space
- **THEN** the checked state toggles and the strike-through updates to match

### Requirement: Todos persist across reloads
The system SHALL save the full list (each todo's text, date, and checked state, in order) in the browser's local storage after every change, and SHALL restore it when the page loads. If stored data is missing, unreadable, or malformed, the system SHALL start with an empty list and SHALL NOT show an error page. If storage is unavailable (for example, blocked by the browser), the list SHALL still work for the current page session.

#### Scenario: Reload keeps todos and checked state
- **WHEN** the user adds "Buy milk" and "Call mom", checks "Buy milk", and reloads the page
- **THEN** both todos are listed in the same order, and "Buy milk" is still checked and struck through

#### Scenario: Corrupted storage
- **WHEN** the stored todo data is not valid
- **THEN** the page loads with the "No todos yet" message and adding a todo works normally

#### Scenario: Storage unavailable
- **WHEN** the browser throws on every local storage access
- **THEN** the user can still add and check todos during the visit
