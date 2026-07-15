/**
 * Shared helpers for indicator board components.
 * Extracted from inline definitions across 13 boards.
 */

/**
 * Truncate a string to maxLen characters, appending "…" if it exceeds the limit.
 * Preserves the behavior of existing inline `tickShort` helpers (maxLen=14 → trim to 12 + "…").
 */
export function tickShort(val: string, maxLen = 24): string {
  return val.length > maxLen ? val.substring(0, maxLen - 2) + '…' : val;
}

/**
 * Returns grid/row CSS classes for chart containers based on view mode.
 * Standard: `grid grid-cols-1 lg:grid-cols-2 gap-6` (grid) or `space-y-6` (row).
 */
export function chartClass(viewMode: string): string {
  return viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6';
}

/**
 * Standard chart container height (tailwind class suffix, e.g. `h-72`).
 */
export const chartH = '72';
