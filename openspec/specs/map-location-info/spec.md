# Map Location Info Specification

## Purpose

Map location info provides a detail panel in the map sidebar when the user selects a geographic region, province, or municipality by clicking/tapping a polygon on the map. It replaces the filter sidebar with aggregated participant statistics for the selected location, and restores the filters upon dismissal.

## Requirements

### R1: Location Selection

Clicking/tapping a GeoJSON polygon MUST select that location. Clicking/tapping the same polygon again MUST deselect it. The system MUST enforce single selection — selecting a new location MUST deselect the previous one.

#### Scenario: Select by click/tap

- GIVEN a map with rendered polygons for regions, provinces, and municipalities
- WHEN the user clicks or taps a polygon
- THEN that location SHALL become selected
- AND the info box SHALL display in the sidebar

#### Scenario: Re-tap deselects

- GIVEN a polygon that is currently selected
- WHEN the user clicks or taps the same polygon
- THEN the location SHALL become deselected
- AND the info box SHALL close

#### Scenario: Single selection enforced

- GIVEN polygon A is selected
- WHEN the user clicks or taps polygon B
- THEN polygon A SHALL become deselected
- AND polygon B SHALL become selected
- AND the info box SHALL update to show polygon B data

### R2: Info Box Content

When a location is selected, the info box MUST display: location name (title case), total participant count, percentage of filtered total, age range (min, max, average), gender breakdown (male/female counts and percentages), top 3 statuses (descending), and top 3 centers (descending).

#### Scenario: Full data display

- GIVEN a selected region with 500 participants
- WHEN the info box renders
- THEN the name SHALL appear in title case
- AND total participants, percentage, age stats SHALL display
- AND gender counts with percentages SHALL display
- AND top 3 statuses and centers SHALL render sorted descending

#### Scenario: Location with zero participants

- GIVEN a selected municipality with no participants
- WHEN the info box renders
- THEN the name SHALL appear in title case
- AND total SHALL show 0
- AND percentage SHALL show 0%
- AND gender counts SHALL show 0 for both M and F
- AND top statuses and centers SHALL display "N/A"
- AND no errors SHALL occur

#### Scenario: Location with only one gender

- GIVEN a selected location with 100% male participants
- WHEN the info box renders
- THEN female count and percentage SHALL show 0
- AND male count SHALL match total participants

#### Scenario: Fewer than 3 items in top lists

- GIVEN a selected location with only 1 active status and 2 centers
- WHEN the info box renders
- THEN the available items SHALL display without padding or placeholders

### R3: Info Box Dismissal

The system MUST dismiss the info box when: the user re-taps the same polygon, or clicks the "Cerrar" button. On dismiss, the filter sidebar MUST restore to its previous state (scroll position, active filters, search query).

#### Scenario: Dismiss via close button

- GIVEN an active info box for a selected location
- WHEN the user clicks the "Cerrar" button
- THEN the location SHALL become deselected
- AND the info box SHALL close
- AND the filter sidebar SHALL reappear with its previous state preserved

#### Scenario: Re-tap dismisses and restores filters

- GIVEN an active info box with filters scrolled to position Y
- WHEN the user taps the selected polygon again
- THEN the info box SHALL close
- AND the filter sidebar SHALL restore scroll position Y

### R4: Desktop Hover Coexistence

On desktop (≥768px), the existing floating hover tooltip MUST continue functioning independently. Polygon click MUST NOT interfere with hover enter/leave events.

#### Scenario: Hover shows tooltip without selecting

- GIVEN a map with polygons on desktop
- WHEN the user hovers over a polygon without clicking
- THEN the floating tooltip SHALL display as a preview
- AND no location SHALL be selected
- AND the filter sidebar SHALL remain unchanged

#### Scenario: Click after hover selects

- GIVEN the floating tooltip is visible for polygon A
- WHEN the user clicks polygon A
- THEN polygon A SHALL become selected
- AND the info box SHALL open in the sidebar
- AND the floating tooltip SHALL remain functional for other polygons

### R5: Responsive Layout

Below 768px viewport width, the info box MUST occupy the full sidebar width. At 768px and above, it MUST occupy the sidebar width (25% of the viewport).

#### Scenario: Mobile full-width layout

- GIVEN a viewport of 375px width
- WHEN the info box renders
- THEN its width SHALL match the full sidebar width
- AND content SHALL be readable without horizontal scroll

#### Scenario: Desktop sidebar layout

- GIVEN a viewport of 1440px width
- WHEN the info box renders
- THEN its width SHALL match the sidebar width (25% of viewport)
- AND content SHALL be vertically scrollable if it exceeds the sidebar height
