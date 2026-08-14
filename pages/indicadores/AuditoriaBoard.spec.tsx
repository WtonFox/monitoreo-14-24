/**
 * Integration spec for AuditoriaBoard (Phase 3 / S3).
 *
 * Uses the REAL computeAuditSignals (no mock of the util) with a small
 * fixture dataset covering the 8 signals: duplicado de carga (ids
 * consecutivos), candidato Q1 (dos rutas), candidato Q2 (fechas distantes),
 * ND cédula, anomalía fecha/edad, vocabulario fuera, centinela y corruptos.
 *
 * Mocks useIndicadoresFilters (filteredData) and useParticipantStore
 * (corruptedItems, syncStats, isSyncing) following the
 * RegistroDiarioBoard.spec.tsx / CalidadIntegradaBoard.spec.tsx pattern.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { validParticipant } from '../../tests/helpers/participants';
import type { Participant } from '../../types';
import type { CorruptedRecord, SyncStats } from '../../stores/participantStore';

// Mock the filters context fully so IndicadoresFilterBar renders
vi.mock('../../contexts/IndicadoresFiltersContext', () => ({
  useIndicadoresFilters: vi.fn(),
  IndicadoresFiltersProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the participant store (zustand hook with selectors)
vi.mock('../../stores/participantStore', () => ({
  useParticipantStore: vi.fn(),
}));

import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { useParticipantStore } from '../../stores/participantStore';
import AuditoriaBoard from './AuditoriaBoard';

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

interface StoreState {
  corruptedItems: CorruptedRecord[];
  syncStats: SyncStats;
  isSyncing: boolean;
}

const defaultSyncStats: SyncStats = {
  loaded: 0,
  errors: 0,
  corrupted: 0,
  duplicated: 0,
  progress: 0,
  erroredPages: [],
};

/** Configure the useParticipantStore mock to answer selectors from `state`. */
const setStoreState = (state: Partial<StoreState> = {}): void => {
  const full: StoreState = {
    corruptedItems: [],
    syncStats: defaultSyncStats,
    isSyncing: false,
    ...state,
  };
  // zustand hook: useParticipantStore(selector) => selector(state)
  vi.mocked(useParticipantStore).mockImplementation(
    ((selector: (s: StoreState) => unknown) => selector(full)) as never
  );
};

/** Fixture covering the 8 audit signals on top of validParticipant. */
const signalFixture = (): Participant[] => [
  // Duplicado de carga (AUD-2): ids consecutivos, misma fecha, misma ruta.
  makeParticipant({ id: 1001, nombres: 'Ana', apellidos: 'Pérez', cedula: '001-0000001-1', fechaRegistro: '2025-01-15', fechaInclusion: null }),
  makeParticipant({ id: 1002, nombres: 'Ana', apellidos: 'Pérez', cedula: '00100000011', fechaRegistro: '2025-01-15', fechaInclusion: null }),
  // Multi-ruta Q1 (AUD-3): misma identidad en dos rutas.
  makeParticipant({ id: 2001, nombres: 'Juan', apellidos: 'García', cedula: '00100000022', rutaFormativa: 'Programa A', fechaInclusion: null }),
  makeParticipant({ id: 2002, nombres: 'Juan', apellidos: 'García', cedula: '00200000022', rutaFormativa: 'Programa B', fechaInclusion: null }),
  // Re-inscripción Q2 (AUD-4): misma ruta, fechas separadas ~8 meses.
  makeParticipant({ id: 3001, nombres: 'María', apellidos: 'De León', fechaRegistro: '2024-01-15', fechaInclusion: null }),
  makeParticipant({ id: 3002, nombres: 'María', apellidos: 'De León', fechaRegistro: '2024-09-15', fechaInclusion: null }),
  // ND cédula (AUD-5).
  makeParticipant({ id: 4001, nombres: 'Carlos', apellidos: 'Ruiz', cedula: 'N/D' }),
  // Anomalía fecha/edad (AUD-6): fecha de nacimiento futura.
  makeParticipant({ id: 5001, nombres: 'Luis', apellidos: 'Mota', fechaNacimiento: '2099-01-01', edad: 0 }),
  // Vocabulario de estados (AUD-7): valor fuera del vocabulario conocido.
  makeParticipant({ id: 6001, nombres: 'Rosa', apellidos: 'Díaz', estado: 'En proceso' }),
  // Centinela (AUD-8): "Sin Centro".
  makeParticipant({ id: 7001, nombres: 'Eva', apellidos: 'Cruz', centro: 'Sin Centro' }),
];

describe('AuditoriaBoard — drill-downs y señales (AUD-2..AUD-10, AUD-12)', () => {
  it('renderiza KPIs y drill-downs con valores de computeAuditSignals real', () => {
    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: signalFixture(),
    });
    setStoreState({
      corruptedItems: [
        { id: 1, raw: {}, reason: 'fecha inválida' },
        { id: 2, raw: {}, reason: 'estructura dañada' },
      ],
      syncStats: { ...defaultSyncStats, corrupted: 2 },
    });

    const { container } = render(<AuditoriaBoard />);
    const text = container.textContent ?? '';

    // KPI labels (AUD-1)
    expect(text).toContain('Duplicados de carga');
    expect(text).toContain('Multi-ruta (Q1)');
    expect(text).toContain('Re-inscripción (Q2)');
    expect(text).toContain('ND Cédula');
    expect(text).toContain('Anomalías fecha/edad');
    expect(text).toContain('Vocabulario de estados');
    expect(text).toContain('Centinelas');
    expect(text).toContain('Corruptos');

    // Valores concretos: ND 1/10 → 10.0%; corruptos count 2 con razones.
    expect(text).toContain('10.0%');
    expect(text).toContain('fecha inválida');
    expect(text).toContain('estructura dañada');

    // Drill-downs con detalle real de cada señal.
    expect(text).toContain('Ana Pérez'); // duplicado
    expect(text).toContain('Programa A'); // Q1 rutas
    expect(text).toContain('Programa B');
    expect(text).toContain('2024-01-15'); // Q2 fechas
    expect(text).toContain('2024-09-15');
    expect(text).toContain('Carlos Ruiz'); // ND cédula
    expect(text).toContain('Fecha de nacimiento futura'); // anomalía
    expect(text).toContain('En proceso'); // vocabulario fuera
    // Centinelas: breakdown por campo (AUD-8) — el fixture Eva Cruz "Sin Centro" aporta 1 al campo Centro.
    expect(text).toContain('Centro');
    expect(text).toContain('Estado');
    expect(text).toContain('Provincia');
    expect(text).toContain('Ruta formativa');
  });

  it('muestra el callout Q3 (AUD-10)', () => {
    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: signalFixture(),
    });
    setStoreState();

    const { container } = render(<AuditoriaBoard />);
    expect(container.textContent).toContain('no respondible sin fecha de egreso');
  });

  it('etiqueta las listas Q1/Q2/duplicados como candidatos con caveat (AUD-12)', () => {
    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: signalFixture(),
    });
    setStoreState();

    const { container } = render(<AuditoriaBoard />);
    const text = container.textContent ?? '';
    expect(text).toContain('candidatos');
    expect(text).toContain('homonimia');
    expect(text).toContain('sin historial en el origen');
  });

  it('muestra estado vacío "Sin datos" cuando no hay participantes filtrados (AUD-1)', () => {
    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: [],
    });
    setStoreState();

    const { container } = render(<AuditoriaBoard />);
    expect(container.textContent).toContain('Sin datos');
  });

  it('muestra el estado de carga del shell mientras sincroniza (AUD-1)', () => {
    vi.mocked(useIndicadoresFilters).mockReturnValue({
      ...baseMockContext,
      filteredData: [],
    });
    setStoreState({ isSyncing: true });

    const { container } = render(<AuditoriaBoard />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
