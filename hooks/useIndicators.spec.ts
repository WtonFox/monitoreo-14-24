/**
 * Characterization spec for useIndicators (M5 — valid-age avg + sex denominator).
 * Expansion indicator tests (IDs 66–83) for PR 3.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIndicators } from './useIndicators';
import { computeIndicators } from '../utils/indicator-computations';
import { validParticipant } from '../tests/helpers/participants';
import type { Participant } from '../types';

const makeParticipant = (overrides: Partial<Participant>): Participant =>
  validParticipant(overrides);

describe('useIndicators — M5 denominator corrections', () => {
  describe('R-demographic-3: Valid-age average denominator', () => {
    it('uses valid-age count for avgAgeNow, not total records', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 25 }),
        makeParticipant({ id: 2, edad: 0 }),
        makeParticipant({ id: 3, edad: 30 }),
        makeParticipant({ id: 4, edad: null as unknown as number }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator4 = result.current.indicators.find(i => i.id === 4);
      // avgAgeNow = (25 + 30) / 2 = 27.5, NOT (25+30+0+0)/4 = 13.75
      expect(indicator4?.value).toContain('27.5');
    });
  });

  describe('R-demographic-1: Unknown sex denominator', () => {
    it('uses known-sex total for women/men percentages', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, sexo: 'F' }),
        makeParticipant({ id: 2, sexo: 'M' }),
        makeParticipant({ id: 3, sexo: null }),
        makeParticipant({ id: 4, sexo: '' }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const womenInd = result.current.indicators.find(i => i.id === 2);
      const menInd = result.current.indicators.find(i => i.id === 3);

      // Known sex total = 2, women = 1/2 = 50%, men = 1/2 = 50%
      expect(womenInd?.value).toBe('50.0%');
      expect(menInd?.value).toBe('50.0%');
    });
  });

  describe('Edge cases', () => {
    it('returns N/A for avgAge when all ages are invalid', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 0 }),
        makeParticipant({ id: 2, edad: 0 }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator4 = result.current.indicators.find(i => i.id === 4);
      expect(indicator4?.value).toContain('N/A');
    });
  });
});

// ── Expansion: New indicators (IDs 66–83) — PR 3 ──

describe('useIndicators — expansion indicadores IDs 66–83', () => {
  describe('ID 66 — Age-bucket distribution', () => {
    it('computes correct bucket counts for mixed ages', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 15 }),   // 14-17
        makeParticipant({ id: 2, edad: 16 }),   // 14-17
        makeParticipant({ id: 3, edad: 19 }),   // 18-20
        makeParticipant({ id: 4, edad: 20 }),   // 18-20
        makeParticipant({ id: 5, edad: 22 }),   // 21-24
        makeParticipant({ id: 6, edad: 24 }),   // 21-24
        makeParticipant({ id: 7, edad: 30 }),   // 25+
        makeParticipant({ id: 8, edad: 45 }),   // 25+
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator66 = result.current.indicators.find(i => i.id === 66);

      expect(indicator66).toBeDefined();
      expect(indicator66!.value).toContain('14-17: 2');
      expect(indicator66!.value).toContain('18-20: 2');
      expect(indicator66!.value).toContain('21-24: 2');
      expect(indicator66!.value).toContain('25+: 2');
      expect(indicator66!.value).toContain('25.0%'); // each bucket is 2/8
      expect(indicator66!.topItems).toHaveLength(4);
    });
  });

  describe('ID 67 — Sex ratio by age group', () => {
    it('shows "∞:1" when men are 0 in a bucket', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 15, sexo: 'F' }),  // women 14-17
        makeParticipant({ id: 2, edad: 19, sexo: 'F' }),  // women 18-20
        makeParticipant({ id: 3, edad: 22, sexo: 'F' }),  // women 21-24
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator67 = result.current.indicators.find(i => i.id === 67);

      expect(indicator67).toBeDefined();
      expect(indicator67!.value).toContain('∞:1');
    });

    it('computes correct ratio when men are present', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 15, sexo: 'F' }),  // women 14-17
        makeParticipant({ id: 2, edad: 16, sexo: 'F' }),  // women 14-17
        makeParticipant({ id: 3, edad: 15, sexo: 'M' }),  // men 14-17
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator67 = result.current.indicators.find(i => i.id === 67);

      expect(indicator67).toBeDefined();
      // women14-17=2, men14-17=1 => 2.0:1
      expect(indicator67!.value).toContain('2.0:1');
    });
  });

  describe('ID 69 — Region mapping', () => {
    it('maps Santo Domingo participants to Ozama region', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, provincia: 'Santo Domingo' }),
        makeParticipant({ id: 2, provincia: 'Santo Domingo' }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator69 = result.current.indicators.find(i => i.id === 69);

      expect(indicator69).toBeDefined();
      expect(indicator69!.value).toContain('Ozama');
    });

    it('groups unmapped provinces as "Desconocido"', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, provincia: 'Nueva York' }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator69 = result.current.indicators.find(i => i.id === 69);

      expect(indicator69).toBeDefined();
      expect(indicator69!.value).toContain('Desconocido');
    });
  });

  describe('ID 75 — Desertion by course', () => {
    it('computes desertion rate per rutaFormativa', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, rutaFormativa: 'Ruta A', estado: 'Retirado' }),
        makeParticipant({ id: 2, rutaFormativa: 'Ruta A', estado: 'Activo' }),
        makeParticipant({ id: 3, rutaFormativa: 'Ruta A', estado: 'Activo' }),
        makeParticipant({ id: 4, rutaFormativa: 'Ruta B', estado: 'Activo' }),
        makeParticipant({ id: 5, rutaFormativa: 'Ruta B', estado: 'Retirado' }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator75 = result.current.indicators.find(i => i.id === 75);

      expect(indicator75).toBeDefined();
      // Ruta A: 1/3 = 33.3%, Ruta B: 1/2 = 50.0%
      expect(indicator75!.value).toContain('Ruta B');
      expect(indicator75!.value).toContain('50.0%');
      expect(indicator75!.value).toContain('Ruta A');
      expect(indicator75!.value).toContain('33.3%');
    });
  });

  describe('ID 80 — Education level by province', () => {
    it('computes predominant education level per province', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, provincia: 'Santo Domingo', nivelEstudio: 'Bachiller' }),
        makeParticipant({ id: 2, provincia: 'Santo Domingo', nivelEstudio: 'Bachiller' }),
        makeParticipant({ id: 3, provincia: 'Santo Domingo', nivelEstudio: 'Universitario' }),
        makeParticipant({ id: 4, provincia: 'Distrito Nacional', nivelEstudio: 'Universitario' }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator80 = result.current.indicators.find(i => i.id === 80);

      expect(indicator80).toBeDefined();
      // Santo Domingo: Bachiller (66.7%, 2/3)
      expect(indicator80!.value).toContain('Santo Domingo');
      expect(indicator80!.value).toContain('Bachiller');
      // Distrito Nacional: Universitario
      expect(indicator80!.value).toContain('Distrito Nacional');
      expect(indicator80!.value).toContain('Universitario');
    });
  });
});

// ── Snapshot: IDs 1–65 unchanged after expansion — PR 3 ──

describe('useIndicators — IDs 1–65 zero-collision snapshot', () => {
  it('produces expected values for a known dataset confirming no regression', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, sexo: 'F', edad: 18, provincia: 'Santo Domingo', centro: 'Centro A', edadRegistro: 17, rutaFormativa: 'Ruta A', estado: 'Activo', nivelEstudio: 'Bachiller', cedula: '001-0000001-1', fechaNacimiento: '2006-01-01T00:00:00.000Z', alergias: null, discapacidades: null, enfermedades: null }),
      makeParticipant({ id: 2, sexo: 'M', edad: 25, provincia: 'Santiago', centro: 'Centro B', edadRegistro: 24, rutaFormativa: 'Ruta B', estado: 'Graduado', nivelEstudio: 'Universitario', cedula: '001-0000002-2', fechaNacimiento: '1999-01-01T00:00:00.000Z', alergias: 'Ninguna', discapacidades: null, enfermedades: 'Asma' }),
      makeParticipant({ id: 3, sexo: null, edad: 0, provincia: 'Nueva York', centro: null, edadRegistro: 0, rutaFormativa: '', estado: 'Retirado', nivelEstudio: '', cedula: null, fechaNacimiento: '2000-01-01T00:00:00.000Z', alergias: null, discapacidades: null, enfermedades: null }),
    ];

    const result = computeIndicators(data);

    // Demographic indicators (IDs 1-4)
    expect(result.indicators.find(i => i.id === 1)?.value).toBeDefined();
    expect(result.indicators.find(i => i.id === 2)?.value).toContain('50.0%');  // women: 1/2 known sex
    expect(result.indicators.find(i => i.id === 3)?.value).toContain('50.0%');  // men: 1/2 known sex
    expect(result.indicators.find(i => i.id === 4)?.value).toContain('21.5');   // avgAge: (18+25)/2

    // Territorial indicators - municipio-based
    expect(result.indicators.find(i => i.id === 6)?.value).toBeDefined();

    // Programa indicators
    expect(result.indicators.find(i => i.id === 10)?.value).toBeDefined();

    // Calidad-dato indicators
    expect(result.indicators.find(i => i.id === 31)?.value).toBeDefined();

    // Desempeno-centro — avg age by center uses edadRegistro
    expect(result.indicators.find(i => i.id === 65)?.value).toContain('20.5');  // (17 + 24) / 2 = 20.5

    // Verify total count is 83 (65 original + 18 new)
    expect(result.indicators).toHaveLength(83);

    // Verify all original IDs 1–65 are present
    for (let id = 1; id <= 65; id++) {
      expect(result.indicators.find(i => i.id === id)).toBeDefined();
    }

    // Verify all new IDs 66–83 are present
    for (let id = 66; id <= 83; id++) {
      expect(result.indicators.find(i => i.id === id)).toBeDefined();
    }
  });
});
