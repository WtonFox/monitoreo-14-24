# Indicadores Impacto Compuesto Specification

## Purpose

Composite impact indicators crossing ≥2 Participant dimensions (vulnerability, programs, gender, age, centro, education, province, tutor) not captured by single-dimension indicators.

## Requirements

### R1: Vulnerability × Program Status

SHALL compute active/graduated % segmented by vulnerability presence.

- GIVEN participants with vulnerabilidades data
- WHEN computation runs
- THEN it SHALL return active and graduated % for vulnerable vs non-vulnerable separately

- GIVEN all participants have vulnerabilidades = null
- WHEN computation runs
- THEN both groups SHALL show status "no-viable"

### R2: Social Programs × Graduation Rate

SHALL compute graduation rate for participants WITH programasSociales vs those WITHOUT.

- GIVEN participants with and without social programs
- WHEN the computation runs
- THEN it SHALL return the graduated % for each group

- GIVEN zero participants have programasSociales
- WHEN the computation runs
- THEN the "with programs" metric SHALL show 0% and status "no-viable"

### R3: Gender × Retention

SHALL compute active rate segmented by sexo (M, F, null).

- GIVEN participants with sexo = "M" and "F"
- WHEN the computation runs
- THEN it SHALL return active % per gender

- GIVEN all participants have sexo = null
- WHEN the computation runs
- THEN all groups SHALL show status "no-viable"

### R4: Age Group × Graduation

SHALL compute graduated count and % across age groups [14-17, 18-20, 21-24].

- GIVEN participants in all three age ranges
- WHEN the computation runs
- THEN it SHALL return count and % per group

- GIVEN participants exist but none aged 14-17
- WHEN the computation runs
- THEN the 14-17 group SHALL show 0 participants and 0%

### R5: Inclusion Time by Center

SHALL compute average days-to-inclusion per centro, sorted descending.

- GIVEN participants across 5 centers with varied inclusion dates
- WHEN the computation runs
- THEN it SHALL return sorted avg-days per center

- GIVEN a center has no participants with fechaInclusion
- WHEN the computation runs
- THEN that center SHALL show "N/A" and rank last

### R6: Education × Social Programs

SHALL compute nivelEstudio distribution among participants in social programs.

- GIVEN participants in programs across education levels
- WHEN the computation runs
- THEN it SHALL return count and % per nivelEstudio

- GIVEN no participants have both programasSociales and nivelEstudio
- WHEN the computation runs
- THEN all levels SHALL show 0 with status "no-viable"

### R7: Multi-vulnerability Concentration

SHALL compute participant count per vulnerability tier: 0, 1, 2+ conditions.

- GIVEN participants with 0, 1, 2, and 3+ comma-separated vulnerabilities
- WHEN the computation runs
- THEN it SHALL return count per tier

- GIVEN no participants have vulnerabilidades data
- WHEN the computation runs
- THEN all tiers SHALL show 0 with status "no-viable"

### R8: Province Success Rate

SHALL compute graduated / (activo + graduated) per provincia.

- GIVEN participants across multiple provinces with varied estados
- WHEN the computation runs
- THEN it SHALL return success rate per province sorted descending

- GIVEN a province has only active and no graduated participants
- WHEN the computation runs
- THEN that province SHALL show 0% success rate

### R9: Coverage × Vulnerability

SHALL compute % of vulnerable participants enrolled in social programs.

- GIVEN vulnerable participants, some in social programs
- WHEN the computation runs
- THEN it SHALL return the coverage percentage

- GIVEN no vulnerable participants are in programs
- WHEN the computation runs
- THEN coverage SHALL show 0%

### R10: Tutor Assignment × Retention

SHALL compute active rate segmented by tutor presence (tutor IS NOT NULL vs IS NULL).

- GIVEN participants with and without tutor
- WHEN the computation runs
- THEN it SHALL return active % for each group

- GIVEN all participants have tutor = null
- WHEN the computation runs
- THEN the WITH-tutor group SHALL show status "no-viable"
