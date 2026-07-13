# Registro Diario de Fichas — Specification

## Purpose

Monitor daily intake volume via KPIs (today, week, month), a 30-day timeline, and a center ranking, all grouped by `fechaRegistro`.

## Requirements

### R1: Time-Period KPIs

The system MUST compute three KPIs: registrations today, this week, and this month, using `fechaRegistro` as the grouping field.

#### Scenario: Active intake day

- GIVEN today has 12 registrations, this week has 45 (incl. today), this month has 180
- WHEN the KPIs render
- THEN "Hoy" SHALL show `12`
- AND "Esta semana" SHALL show `45`
- AND "Este mes" SHALL show `180`

#### Scenario: No registrations today

- GIVEN zero participants have `fechaRegistro` matching today's date
- WHEN the KPIs render
- THEN "Hoy" SHALL show `0`
- AND the other KPIs SHALL still reflect week/month totals

### R2: 30-Day Timeline

The system MUST render a bar or line chart showing daily registrations for the last 30 days.

#### Scenario: Full timeline renders

- GIVEN 30 days of data with varying counts (0–50 per day)
- WHEN the chart renders
- THEN 30 bars SHALL appear (one per day)
- AND each bar SHALL be labeled with its date
- AND the y-axis SHALL show the registration count

#### Scenario: Single-day data

- GIVEN all participants share the same `fechaRegistro` (today)
- WHEN the chart renders
- THEN 30 bars SHALL appear
- AND only today's bar SHALL have a non-zero height

### R3: Center Ranking

The system MUST render a ranked table of centers by total registration count.

#### Scenario: Centers ranked correctly

- GIVEN center "A" has 100 registrations, "B" has 60, "C" has 40
- WHEN the ranking renders
- THEN order SHALL be A > B > C
- AND each row SHALL show rank, center name, and count

#### Scenario: Tied centers

- GIVEN two centers each have 50 registrations
- WHEN the ranking renders
- THEN they SHALL appear consecutively
- AND both SHALL show count `50`

### R4: Date Arithmetic Integrity

The system MUST derive "today", "this week" (Mon–Sun), and "this month" boundaries from the client's current date — NOT from a server timestamp — and MUST recompute on day changes without a full page reload.

#### Scenario: Cross-month week

- GIVEN today is Monday July 13th, AND 5 registrations from July 12th (Sunday, previous week)
- WHEN computing "this week"
- THEN July 12th SHALL NOT be included
- AND the week total SHALL reflect Mon–Sun of the current week only
