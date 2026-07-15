# Calidad del Dato (Unified) — Specification

## Purpose

Replace the separate CalidadDatoBoard and CalidadNdBoard with a single `CalidadIntegradaBoard` that displays both completeness metrics (IDs 37–42) and ND metrics (11-field enumeration) side by side.

## Requirements

### R1: Global ND Percentage KPI

The system MUST compute `% no disponible = count(fields with nd/null/""/"N/D"/"No Disponible") / (total_participants × 11 fields) × 100`.

#### Scenario: Mixed data quality

- GIVEN 100 participants across 11 fields (1100 total cells), 220 are "nd"/null
- WHEN the KPI renders
- THEN the value SHALL be `20.0%`
- AND the label SHALL read "% de datos no disponibles"

#### Scenario: Perfect data

- GIVEN every field across all participants has a valid non-nd value
- WHEN the KPI renders
- THEN the value SHALL be `0.0%`

### R2: Field Quality Ranking

The system MUST render a ranked table of the 11 inspected fields sorted by their ND percentage descending.

#### Scenario: Fields ranked correctly

- GIVEN "telefonos" is 60% ND, "alergias" is 45% ND, "nivelEstudio" is 5% ND
- WHEN the ranking renders
- THEN "telefonos" SHALL be #1
- AND "nivelEstudio" SHALL be last
- AND each row SHALL show field label, ND count, ND percentage, and total records

#### Scenario: All fields at 0% ND

- GIVEN zero ND values across all 11 fields
- WHEN the ranking renders
- THEN all rows SHALL show `0`
- AND the table SHALL NOT be empty (the fields still exist)

### R3: Per-Province Breakdown

The system MUST allow switching to a per-province view showing field ND percentages for each province.

#### Scenario: Province breakdown renders

- GIVEN province filter is set to "Santiago", AND "telefonos" is 80% ND in Santiago
- WHEN the per-province breakdown renders
- THEN "telefonos" SHALL show 80% in the province-specific ranking
- AND the KPI SHALL reflect only Santiago's data

#### Scenario: Province with zero participants

- GIVEN province filter matches no participants
- WHEN the breakdown renders
- THEN the KPI SHALL show `0.0%`
- AND the ranking SHALL show "Sin datos"

### R4: Inspected Fields

The system MUST inspect exactly these 11 fields: `telefonos`, `telefonosResponsable`, `cedulaTutor`, `tutor`, `alergias`, `discapacidades`, `enfermedades`, `programasSociales`, `nivelEstudio`, `estadoCivil`, `direccion`.

> **Nota**: Los campos `sector`, `nombreTutor` y `apellidoTutor` no existen en el tipo `Participant` real. `tutor` es un campo combinado que reemplaza el par nombreTutor/apellidoTutor del spec original.

#### Scenario: All fields present in ranking

- GIVEN filtered data
- WHEN the ranking renders
- THEN exactly 11 rows SHALL appear
- AND each row SHALL correspond to one of the 11 fields

### R5: Unified Board Display

The system MUST render a single integrated board showing:
- **Completeness section** (existing CalidadDatoBoard logic via `boardData.qualityData`): KPI of completeness percentage, per-field completeness ranking for fields: `cedula`, `fechaNacimiento`, `nivelEstudio`, `alergias`, `discapacidades`, `enfermedades`.
- **ND section** (existing CalidadNdBoard logic via internal FIELDS enumeration): KPI of ND percentage, per-field ND ranking for 11 fields: `telefonos`, `telefonosResponsable`, `cedulaTutor`, `tutor`, `alergias`, `discapacidades`, `enfermedades`, `programasSociales`, `nivelEstudio`, `estadoCivil`, `direccion`.

#### Scenario: Unified board renders both sections

- GIVEN the filtered dataset
- WHEN `CalidadIntegradaBoard` renders
- THEN the completeness KPI SHALL display independently from the ND KPI
- AND the completeness ranking SHALL show the 6 quality fields
- AND the ND ranking SHALL show the 11 socio-demographic fields
- AND both sections SHALL be visually separated with section headers

#### Scenario: Completeness vs ND values differ

- GIVEN a dataset where completeness is 95% but ND is 15%
- WHEN the unified board renders
- THEN the completeness KPI SHALL show 95%
- AND the ND KPI SHALL show 15%
- AND the two values SHALL NOT be confused or averaged

#### Scenario: Both sections respect filter

- GIVEN provincia="Santiago"
- WHEN the unified board renders
- THEN both completeness and ND sections SHALL reflect Santiago-only data
- AND both SHALL use the same filtered dataset

#### Scenario: Empty dataset

- GIVEN zero participants match the active filters
- WHEN the unified board renders
- THEN both KPIs SHALL show 0.0%
- AND both rankings SHALL show "Sin datos" empty state

### Route Change

- `/indicadores/calidad-dato` SHALL render `CalidadIntegradaBoard`
- `/indicadores/calidad-nd` SHALL redirect to `/indicadores/calidad-dato`
- The `INDICADORES_CALIDAD_ND` route constant SHALL point to `/indicadores/calidad-dato` (redirect target)
