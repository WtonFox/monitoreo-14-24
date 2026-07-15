/**
 * Basic sanity tests for the performance fixtures.
 *
 * Verifies count, structure, and determinism.
 */
import { describe, it, expect } from 'vitest';
import {
  generateParticipants,
  perfFixture10k,
  perfFixture67k,
  perfFixture100k,
} from './participants-perf';

describe('participants-perf fixture', () => {
  it('generates exactly 10 000 records', () => {
    expect(perfFixture10k(42)).toHaveLength(10_000);
  });

  it('generates exactly 67 000 records', () => {
    expect(perfFixture67k(42)).toHaveLength(67_000);
  });

  it('generates exactly 100 000 records', () => {
    expect(perfFixture100k(42)).toHaveLength(100_000);
  });

  it('is deterministic — same seed produces identical data', () => {
    const a = generateParticipants(500, 42);
    const b = generateParticipants(500, 42);
    expect(a).toEqual(b);
  });

  it('different seed produces different data', () => {
    const a = generateParticipants(500, 42);
    const b = generateParticipants(500, 99);
    expect(a).not.toEqual(b);
  });

  it('every record has required fields populated', () => {
    const data = perfFixture10k();
    for (const p of data) {
      expect(p.id).toBeGreaterThan(0);
      expect(p.edad).toBeGreaterThan(0);
      expect(p.sexo).toBeTruthy();
      expect(p.estado).toBeTruthy();
      expect(p.provincia).toBeTruthy();
      expect(p.municipio).toBeTruthy();
      expect(p.centro).toBeTruthy();
    }
  });

  it('distributes across multiple provinces', () => {
    const data = perfFixture67k();
    const provinces = new Set(data.map(p => p.provincia));
    expect(provinces.size).toBeGreaterThanOrEqual(20);
  });

  it('distributes across multiple centers', () => {
    const data = perfFixture67k();
    const centers = new Set(data.map(p => p.centro));
    expect(centers.size).toBeGreaterThanOrEqual(6);
  });
});
