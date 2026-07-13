# Indicator Boards Data Specification

## Purpose

Provide a `useIndicatorBoards` hook that transforms raw `Participant[]` data into structured, Recharts-compatible datasets for all 4 board categories.

## Requirements

| ID | Requirement | Keyword |
|----|-------------|---------|
| D1 | `useIndicatorBoards(data: Participant[])` MUST return an object with 4 slices: `demographicData`, `territorialData`, `programData`, `socialData` | MUST |
| D2 | All computations MUST be wrapped in `useMemo` keyed on `data` | MUST |
| D3 | Each slice MUST return Recharts-compatible arrays of `{ name: string, value: number }` objects | MUST |
| D4 | The hook MUST aggregate data in a single pass — no multiple `data.filter()` calls for the same categorization | MUST |

### `demographicData` structure

| Field | Shape | Description |
|-------|-------|-------------|
| `gender` | `{ name, value }[]` | Count per sexo value, plus `total` |
| `ageBuckets` | `{ name, value }[]` | Buckets: `14-17`, `18-20`, `21-24`, `25+` using `edad` |
| `estadoCivil` | `{ name, value }[]` | Count per estadoCivil, excluding N/A |
| `genderByAge` | `{ name, Femenino, Masculino }[]` | Cross-tabulation: one row per age bucket, columns for each sex |

### `territorialData` structure

| Field | Shape | Description |
|-------|-------|-------------|
| `topMunicipios` | `{ name, value }[]` | Top 10 municipios by participant count |
| `topCentros` | `{ name, value }[]` | Top 10 centros by participant count |
| `topCursos` | `{ name, value }[]` | Top 10 rutaFormativa by participant count |
| `genderByMunicipio` | `{ name, Femenino, Masculino }[]` | Top 10 municipios with per-gender counts |

### `programData` structure

| Field | Shape | Description |
|-------|-------|-------------|
| `status` | `{ name, value }[]` | Count per estado value |
| `activeGraduatedByCentro` | `{ name, Activos, Egresados }[]` | Top 10 centros with active + graduated counts |
| `activeGraduatedByMunicipio` | `{ name, Activos, Egresados }[]` | Top 10 municipios with active + graduated counts |

### `socialData` structure

| Field | Shape | Description |
|-------|-------|-------------|
| `phoneCompleteness` | `{ name, value }[]` | `[{ name: "Completo", value }, { name: "Incompleto", value }]` |
| `addressCompleteness` | `{ name, value }[]` | Same shape as phoneCompleteness for direccion |
| `genderByCentro` | `{ name, Femenino, Masculino }[]` | Top 10 centros |
| `genderByCurso` | `{ name, Femenino, Masculino }[]` | Top 10 cursos |
| `ageGroupByCentro` | `{ name, value }[]` | Top 10 centros with edad bucket count |
| `ageGroupByCurso` | `{ name, value }[]` | Top 10 cursos with edad bucket count |

### Scenario: Returns structured data for populated array

- GIVEN `data` contains 100 participants with varied sexo, edad, municipio, centro, rutaFormativa, estado
- WHEN `useIndicatorBoards(data)` is called
- THEN all 4 slices return non-empty arrays
- AND `demographicData.gender` length matches distinct sexo values
- AND `demographicData.ageBuckets` length equals 4 buckets

### Scenario: Graceful empty data

- GIVEN `data` is an empty array
- WHEN the hook runs
- THEN each slice returns an empty array
- AND the hook does not throw

### Scenario: Null field handling

- GIVEN participants with null/undefined sexo, centro, estado, edad
- WHEN the hook computes aggregates
- THEN those participants are counted under an "Unknown" bucket where applicable
- AND the hook does not crash
