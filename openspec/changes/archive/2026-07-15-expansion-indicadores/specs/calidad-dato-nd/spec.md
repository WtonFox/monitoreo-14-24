# Calidad del Dato (Unified) — Delta Specification

## Purpose

Replace the separate CalidadDatoBoard and CalidadNdBoard with a single `CalidadIntegradaBoard` that displays both completeness metrics (existing IDs 37–42) and ND metrics (11-field enumeration) side by side.

## Changes from Existing Spec

### REMOVED: R5 — Distinct from CalidadDatoBoard

The requirement that CalidadNdBoard be distinct from CalidadDatoBoard (original spec R5) is REMOVED. Both boards are now merged into one.

### ADDED: R6 — Unified Board Display

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
