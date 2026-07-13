# Participant Data Specification

## Requirements

### R1: Type Schema

Participant MUST add `edadRegistro` (number), `estadoCivil`, `nivelEstudio`, `alergias`, `discapacidades`, `enfermedades`, `programasSociales` (`string | null`). Existing 20 fields SHALL remain.

- GIVEN `types.ts`
- WHEN updated
- THEN Participant SHALL contain all 27 fields

### R2: IndexedDB Migration

DB_VERSION SHALL increment 1→2 preserving all records. New fields default to `null` for migrated rows.

- GIVEN IndexedDB v1 with records
- WHEN the upgrade fires
- THEN existing records SHALL be intact with new fields = `null`

- GIVEN no existing DB
- WHEN the app initializes
- THEN a v2 store SHALL be created

### R3: Sanitization

`sanitizeParticipant()` MUST normalize PascalCase API to camelCase and default missing fields to `null`.

- GIVEN `{EdadRegistro: 25}` from API
- WHEN sanitized
- THEN output SHALL contain `edadRegistro: 25`

### R4: Exports

All export formats (CSV, JSON, XLSX) MUST include the 7 new fields.

- GIVEN a participant list with fields populated
- WHEN any export triggers
- THEN each output row SHALL contain all 27 fields

### R5: Backward Compatibility

Existing components referencing 20-field Participant SHALL NOT break.

- GIVEN an existing chart computing `edad`
- WHEN Participant gains `edadRegistro`
- THEN the chart SHALL display the same `edad` value
