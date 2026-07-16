# Participant Detail Modal Specification

## Purpose

Provides a read-only detail view of a single participant's complete data via a modal dialog, triggered by row click or an explicit "Ver detalle" button. Receives data from in-memory `dashboardData` — no additional API requests.

## Requirements

### R1: Open modal on row click

Clicking any cell in a participant row MUST open the modal with that participant's data.

#### Scenario: Row click opens modal
- GIVEN the DataTable displays participants
- WHEN user clicks any cell (excluding column header toggles)
- THEN the ParticipantDetailModal SHALL open with the clicked participant

#### Scenario: No action on header click
- GIVEN the DataTable header row
- WHEN user clicks a header cell
- THEN the modal SHALL NOT open (sort toggles instead)

### R2: Open modal via Actions column

An Actions column with a "Ver detalle" icon button SHALL be present in every row.

#### Scenario: Actions button opens modal
- GIVEN the Actions column is visible
- WHEN user clicks the "Ver detalle" icon
- THEN the ParticipantDetailModal SHALL open

#### Scenario: Actions column hidden
- GIVEN user hides the Actions column via toggles
- WHEN user clicks the same row area
- THEN the modal SHALL still open (row click triggers independently of Actions column)

### R3: Display all participant fields

The modal MUST display 27 fields in a responsive grid. Null fields SHALL show "—".

#### Scenario: Full field display
- GIVEN a participant with 27 populated fields
- WHEN the modal opens
- THEN all fields SHALL be visible with Spanish labels and their values

Fields: id, nombres, apellidos, cedula, edad, fechaNacimiento, fechaRegistro, fechaInclusion, tutor, cedulaTutor, vulnerabilidades, estado, sexo, provincia, municipio, centro, direccion, rutaFormativa, telefonos, telefonosResponsable, edadRegistro, estadoCivil, nivelEstudio, alergias, discapacidades, enfermedades, programasSociales.

#### Scenario: Partial null fields
- GIVEN a participant with some null fields (e.g., no tutor)
- WHEN the modal opens
- THEN null fields SHALL display "—" as placeholder
- AND the field label SHALL remain visible

#### Scenario: Responsive overflow
- GIVEN a modal displayed on a narrow viewport (≤768px)
- WHEN content exceeds modal height
- THEN the modal body SHALL scroll internally with a max-height constraint

### R4: Close modal

The modal MUST support three closing methods.

#### Scenario: Close via X button
- GIVEN the modal is open
- WHEN user clicks the X button
- THEN the modal SHALL close

#### Scenario: Close via overlay click
- GIVEN the modal is open
- WHEN user clicks outside the modal content area
- THEN the modal SHALL close

#### Scenario: Close via Escape
- GIVEN the modal is open
- WHEN user presses Escape key
- THEN the modal SHALL close

### R5: Zero data fetch

The modal MUST NOT make any API or service calls.

#### Scenario: No network requests
- GIVEN `dashboardData` is already loaded in memory
- WHEN the modal opens
- THEN zero XHR/fetch calls SHALL be made

### R6: Grid layout

The modal body SHALL arrange fields in a CSS grid with auto-fill columns.

#### Scenario: Desktop layout
- GIVEN viewport ≥ 1024px
- WHEN the modal renders
- THEN fields SHALL display in 2 or more columns

#### Scenario: Mobile layout
- GIVEN viewport < 640px
- WHEN the modal renders
- THEN fields SHALL display in a single column
