# Performance Specification

## Purpose

Define the benchmark protocol and performance budget for 67k-record responsiveness. All optimization follows a **benchmark-first** approach: measure the production build, then optimize only measured hotspots.

## Requirements

### R-perf-1: Benchmark Protocol

The system MUST provide a repeatable production-build benchmark using deterministic 10k, 67k, and 100k API fixtures. Measurements MUST include: commit-to-paint, long tasks (>50ms), JS heap memory, filter latency, route-change latency, and map aggregation time. The benchmark SHALL run on `npm run build` then serve, never dev mode.

#### Scenario: Production-build benchmark with three fixture sizes

- GIVEN deterministic fixtures of 10k, 67k, and 100k records
- WHEN the production build serves each fixture and the indicators page renders
- THEN commit-to-paint, long-task count (>50ms), and heap memory SHALL be recorded per fixture

#### Scenario: All five measurement dimensions captured

- GIVEN the 67k fixture under a production build
- WHEN the benchmark runs
- THEN filter latency, route-change latency, and map aggregation time SHALL be recorded

### R-perf-2: Active-Slice Aggregation

The indicators board MUST compute only the currently visible board slice, not all 9 slices. For example: when the user is on Demográficos tab, only `demographicData` aggregates; the other eight slices SHALL NOT compute.

#### Scenario: Single-slice computation on a detail board

- GIVEN the user navigates to Demográficos tab
- WHEN `boardData` computes
- THEN only the `demographicData` slice SHALL aggregate
- AND `territorialData`, `programData`, `socialData`, `qualityData`, `vulnerabilityData`, `temporalData`, `educationData`, `centerData` SHALL NOT compute

#### Scenario: Overview page still computes all groups

- GIVEN the user is on the Resumen (overview) tab
- WHEN `useIndicators()` runs
- THEN all 65 indicators SHALL compute as specified

### R-perf-3: Map Aggregation Optimization

`useMapStats` MUST replace the current O(locations × records) pattern with a single-pass aggregation using a `Map<location, accumulator>`. Target: O(records) total, not locations × records.

#### Scenario: Single-pass location stats

- GIVEN 67k participants across multiple locations
- WHEN `locationStats` memo computes
- THEN each record SHALL be visited exactly once
- AND the internal `data.filter(p => pLoc === loc)` per location SHALL NOT execute

#### Scenario: Correctness preserved

- GIVEN the same 10k fixture
- WHEN aggregating before and after optimization
- THEN all result fields (total, genderBreakdown, statusBreakdown, ageRanges, topCenters) SHALL match exactly

### R-perf-4: Overview Aggregation Budget

`useIndicators.ts` (1087 lines) SHALL be benchmarked first. If aggregation exceeds 50ms on 67k records, overlapping sub-aggregations SHALL be consolidated or memoized. If still >50ms, slices SHALL be scheduled in `requestIdleCallback`.

#### Scenario: 67k overview meets 50ms task budget

- GIVEN 67k records and a production build
- WHEN `useIndicators()` runs
- THEN total computation SHALL NOT exceed 50ms in any single task
- AND commit-to-paint SHALL NOT exceed 500ms

#### Scenario: Idle callback fallback for heavy slices

- GIVEN 67k records and measured frame drops >50ms after consolidation
- WHEN the overview renders
- THEN the heaviest aggregation slices SHALL execute in `requestIdleCallback` or a Web Worker

### R-perf-5: Worker or Idle Scheduling Gate

If R-perf-2 through R-perf-4 still leave frame drops >50ms on 67k after optimization, the heavy aggregation slices MUST be scheduled in `requestIdleCallback` or a Web Worker. This is a pass/fail threshold, not a suggestion.

#### Scenario: Full benchmark passes budget

- GIVEN 67k records and active-slice + map optimization applied
- WHEN the full benchmark suite runs
- THEN all measurements SHALL be within budget (no individual task >50ms, commit-to-paint <500ms)
