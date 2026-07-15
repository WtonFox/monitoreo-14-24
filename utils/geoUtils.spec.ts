/**
 * Unit tests for geoUtils — findRegion() and REGION_PROVINCES mapping.
 */
import { describe, it, expect } from 'vitest';
import { findRegion, normalizeProvinceName } from './geoUtils';

describe('findRegion — planning region mapping', () => {
  describe('all 10 regions map correctly from their constituent provinces', () => {
    it('maps Santiago → Cibao Norte', () => {
      expect(findRegion('Santiago')).toBe('Cibao Norte');
    });

    it('maps Puerto Plata → Cibao Norte', () => {
      expect(findRegion('Puerto Plata')).toBe('Cibao Norte');
    });

    it('maps La Vega → Cibao Sur', () => {
      expect(findRegion('La Vega')).toBe('Cibao Sur');
    });

    it('maps Duarte → Cibao Nordeste', () => {
      expect(findRegion('Duarte')).toBe('Cibao Nordeste');
    });

    it('maps Valverde → Cibao Noroeste', () => {
      expect(findRegion('Valverde')).toBe('Cibao Noroeste');
    });

    it('maps San Cristóbal → Valdesia', () => {
      expect(findRegion('San Cristóbal')).toBe('Valdesia');
    });

    it('maps Barahona → Enriquillo', () => {
      expect(findRegion('Barahona')).toBe('Enriquillo');
    });

    it('maps San Juan → El Valle', () => {
      expect(findRegion('San Juan')).toBe('El Valle');
    });

    it('maps La Romana → Yuma', () => {
      expect(findRegion('La Romana')).toBe('Yuma');
    });

    it('maps San Pedro de Macorís → Higuamo', () => {
      expect(findRegion('San Pedro de Macorís')).toBe('Higuamo');
    });

    it('maps Santo Domingo → Ozama', () => {
      expect(findRegion('Santo Domingo')).toBe('Ozama');
    });

    it('maps Distrito Nacional → Ozama', () => {
      expect(findRegion('Distrito Nacional')).toBe('Ozama');
    });
  });

  describe('case-insensitive and variation handling', () => {
    it('handles uppercase input', () => {
      expect(findRegion('SANTO DOMINGO')).toBe('Ozama');
    });

    it('handles lowercase input', () => {
      expect(findRegion('santiago')).toBe('Cibao Norte');
    });

    it('handles mixed case input', () => {
      expect(findRegion('sAn cRisTóBaL')).toBe('Valdesia');
    });

    it('handles common alias "San Juan de la Maguana" → El Valle', () => {
      expect(findRegion('San Juan de la Maguana')).toBe('El Valle');
    });
  });

  describe('edge cases', () => {
    it('returns "Desconocido" for unmapped province', () => {
      expect(findRegion('Nueva York')).toBe('Desconocido');
    });

    it('returns "Desconocido" for empty string', () => {
      expect(findRegion('')).toBe('Desconocido');
    });

    it('returns "Desconocido" for null', () => {
      expect(findRegion(null as unknown as string)).toBe('Desconocido');
    });

    it('returns "Desconocido" for undefined', () => {
      expect(findRegion(undefined as unknown as string)).toBe('Desconocido');
    });

    it('returns "Desconocido" for province with only whitespace', () => {
      expect(findRegion('   ')).toBe('Desconocido');
    });
  });
});

describe('normalizeProvinceName', () => {
  it('normalizes all-caps to proper casing', () => {
    expect(normalizeProvinceName('SANTO DOMINGO')).toBe('Santo Domingo');
  });

  it('handles "Bahoruco" alias', () => {
    const normalized = normalizeProvinceName('BAHORUCO');
    expect(['Baoruco', 'Bahoruco']).toContain(normalized);
  });
});
