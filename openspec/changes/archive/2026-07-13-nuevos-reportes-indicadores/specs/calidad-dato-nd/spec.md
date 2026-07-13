# Calidad del Dato (ND) — Specification

## Purpose

Measure data quality by counting fields with "nd", null, or unavailable values across 15 key participant fields, per-province breakdown.

## Requirements

### R1: Global ND Percentage KPI

The system MUST compute `% no disponible = count(fields with nd/null/""/"N/D"/"No Disponible") / (total_participants × 15 fields) × 100`.

#### Scenario: Mixed data quality

- GIVEN 100 participants across 15 fields (1500 total cells), 300 are "nd"/null
- WHEN the KPI renders
- THEN the value SHALL be `20.0%`
- AND the label SHALL read "% de datos no disponibles"

#### Scenario: Perfect data

- GIVEN every field across all participants has a valid non-nd value
- WHEN the KPI renders
- THEN the value SHALL be `0.0%`

### R2: Field Quality Ranking

The system MUST render a ranked table of the 15 inspected fields sorted by their ND percentage descending.

#### Scenario: Fields ranked correctly

- GIVEN "telefonos" is 60% ND, "alergias" is 45% ND, "nivelEstudio" is 5% ND
- WHEN the ranking renders
- THEN "telefonos" SHALL be #1
- AND "nivelEstudio" SHALL be last
- AND each row SHALL show field label, ND count, ND percentage, and total records

#### Scenario: All fields at 0% ND

- GIVEN zero ND values across all 15 fields
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

The system MUST inspect exactly these 15 fields: `telefonos`, `telefonosResponsable`, `cedulaTutor`, `alergias`, `discapacidades`, `enfermedades`, `programasSociales`, `nivelEstudio`, `estadoCivil`, `direccion`, `sector`, `nombreTutor`, `apellidoTutor`.

#### Scenario: All fields present in ranking

- GIVEN filtered data
- WHEN the ranking renders
- THEN exactly 15 rows SHALL appear
- AND each row SHALL correspond to one of the 15 fields

### R5: Distinct from CalidadDatoBoard

The system SHALL NOT reuse or duplicate logic from the existing `CalidadDatoBoard`. This board measures ND frequency across participant socio-demographic fields, not completeness of contact fields.

#### Scenario: Different scope confirmed

- GIVEN the existing CalidadDatoBoard tracks phone/address completeness
- WHEN CalidadNdBoard renders
- THEN its KPI value SHALL be different from CalidadDatoBoard's (same dataset, different metrics)
- AND no shared computation coupling SHALL exist
