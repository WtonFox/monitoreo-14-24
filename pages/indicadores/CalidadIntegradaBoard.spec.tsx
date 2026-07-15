/**
 * Integration test for CalidadIntegradaBoard — completeness + ND metrics.
 * PR 3 — Phase 5, Task 5.3
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { validParticipant } from '../../tests/helpers/participants';
import type { Participant } from '../../types';
import type { QualitySlice } from '../../hooks/computeBoardData';

// Mock the filters context (same pattern as RegistroDiarioBoard.spec.tsx)
vi.mock('../../contexts/IndicadoresFiltersContext', () => ({
  useIndicadoresFilters: vi.fn(),
  IndicadoresFiltersProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import CalidadIntegradaBoard from './CalidadIntegradaBoard';

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
  isDataLoading: false,
};

describe('CalidadIntegradaBoard — unified completeness + ND board', () => {
  it('renders completeness and ND KPIs with mock data', () => {
    const qualityData: QualitySlice = {
      cedulaPct: 80,
      birthDatePct: 75,
      educationPct: 90,
      allergiesPct: 60,
      disabilitiesPct: 50,
      diseasesPct: 85,
      fieldBreakdown: [
        { name: 'Cédula', pct: 80, total: 10, ndCount: 2 },
        { name: 'Fecha Nac.', pct: 75, total: 10, ndCount: 2.5 },
        { name: 'Nivel Estudio', pct: 90, total: 10, ndCount: 1 },
        { name: 'Alergias', pct: 60, total: 10, ndCount: 4 },
        { name: 'Discapacidades', pct: 50, total: 10, ndCount: 5 },
        { name: 'Enfermedades', pct: 85, total: 10, ndCount: 1.5 },
      ],
    };

    const participants: Participant[] = [
      makeParticipant({ id: 1, telefonos: '809-555-0101' }),
      makeParticipant({ id: 2, telefonos: '' }),        // ND
      makeParticipant({ id: 3, telefonos: 'nd' }),       // ND
      makeParticipant({ id: 4, telefonos: null as unknown as string }), // ND
    ];

    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: participants,
      boardData: { qualityData } as any,
    });

    const { container } = render(<CalidadIntegradaBoard />);

    // Verify completeness KPI section renders
    expect(container.textContent).toContain('Completitud');
    expect(container.textContent).toContain('Completitud General');

    // Verify ND KPI section renders separately
    expect(container.textContent).toContain('No Disponibles');
    expect(container.textContent).toContain('ND');

    // Verify specific KPIs
    expect(container.textContent).toContain('Campos > 80%');
    expect(container.textContent).toContain('Campos Críticos');
  });

  it('renders empty state when no data', () => {
    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: [],
      boardData: {
        qualityData: {
          cedulaPct: 0,
          birthDatePct: 0,
          educationPct: 0,
          allergiesPct: 0,
          disabilitiesPct: 0,
          diseasesPct: 0,
          fieldBreakdown: [],
        },
      } as any,
    });

    const { container } = render(<CalidadIntegradaBoard />);

    // BoardShell empty state
    expect(container.textContent).toContain('Sin datos');
  });

  it('renders loading state', () => {
    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: [],
      boardData: {
        qualityData: {
          cedulaPct: 0,
          birthDatePct: 0,
          educationPct: 0,
          allergiesPct: 0,
          disabilitiesPct: 0,
          diseasesPct: 0,
          fieldBreakdown: [],
        },
      } as any,
      isDataLoading: true,
    });

    const { container } = render(<CalidadIntegradaBoard />);

    // Loading skeleton
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('renders ND metrics independently from completeness', () => {
    // Participants with varied ND values
    const participants: Participant[] = [
      makeParticipant({ id: 1, telefonos: '809-555-0101', tutor: 'Tutor A' }),
      makeParticipant({ id: 2, telefonos: 'nd', tutor: '' }),       // ND telefonos, ND tutor
      makeParticipant({ id: 3, telefonos: '', tutor: 'Tutor B' }),  // ND telefonos
    ];

    const qualityData: QualitySlice = {
      cedulaPct: 100,
      birthDatePct: 100,
      educationPct: 100,
      allergiesPct: 100,
      disabilitiesPct: 100,
      diseasesPct: 100,
      fieldBreakdown: [
        { name: 'Cédula', pct: 100, total: 3, ndCount: 0 },
        { name: 'Fecha Nac.', pct: 100, total: 3, ndCount: 0 },
        { name: 'Nivel Estudio', pct: 100, total: 3, ndCount: 0 },
        { name: 'Alergias', pct: 100, total: 3, ndCount: 0 },
        { name: 'Discapacidades', pct: 100, total: 3, ndCount: 0 },
        { name: 'Enfermedades', pct: 100, total: 3, ndCount: 0 },
      ],
    };

    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: participants,
      boardData: { qualityData } as any,
    });

    const { container } = render(<CalidadIntegradaBoard />);

    // Completeness shows 100%
    expect(container.textContent).toContain('100.0%');

    // ND section renders with its own metrics
    expect(container.textContent).toContain('Teléfonos');
    expect(container.textContent).toContain('Nombre Tutor');
  });
});
