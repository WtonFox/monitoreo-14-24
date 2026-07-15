/**
 * Characterization spec for RegistroDiarioBoard (M5 — midnight recompute).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { advance } from '../../tests/helpers/time';
import { validParticipant } from '../../tests/helpers/participants';
import type { Participant } from '../../types';

// Mock the filters context fully so IndicadoresFilterBar renders
vi.mock('../../contexts/IndicadoresFiltersContext', () => ({
  useIndicadoresFilters: vi.fn(),
  IndicadoresFiltersProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import RegistroDiarioBoard from './RegistroDiarioBoard';

const makeParticipant = (overrides: Partial<Participant>): Participant =>
  validParticipant(overrides);

const baseMockContext = {
  filteredData: [] as Participant[],
  year: 'todos',
  province: 'todos',
  municipio: 'todos',
  sex: 'todos',
  setYear: vi.fn(),
  setProvince: vi.fn(),
  setMunicipio: vi.fn(),
  setSex: vi.fn(),
  availableYears: [],
  availableMunicipios: [],
  boardData: {} as any,
  isStale: false,
};

describe('RegistroDiarioBoard — M5 midnight recompute', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Freeze at 2026-07-13 23:59:58
    vi.setSystemTime(new Date('2026-07-13T23:59:58'));
  });

  it('renders KPIs with today date from frozen clock', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, fechaRegistro: '2026-07-13T10:00:00' }),
    ];

    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: data,
    });

    const { container } = render(<RegistroDiarioBoard />);
    expect(container.textContent).toContain('Fichas Hoy');
  });

  it('recomputes KPIs when clock advances past midnight', async () => {
    const data: Participant[] = [
      // Registration on July 13
      makeParticipant({ id: 1, fechaRegistro: '2026-07-13T10:00:00' }),
      // Registration on July 14
      makeParticipant({ id: 2, fechaRegistro: '2026-07-14T08:00:00' }),
    ];

    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: data,
    });

    const { container, rerender } = render(<RegistroDiarioBoard />);

    // Initially clock is July 13 23:59:58
    expect(container.textContent).toContain('Fichas Hoy');

    // Advance past midnight to July 14
    await act(async () => {
      advance(4000); // 4 seconds — now July 14 00:00:02
    });

    // Trigger the interval tick
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    // Re-render to pick up state update
    rerender(<RegistroDiarioBoard />);
    expect(container.textContent).toContain('Fichas Hoy');
  });
});
