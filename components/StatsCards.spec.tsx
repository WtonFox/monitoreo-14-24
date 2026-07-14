/**
 * Characterization spec for StatsCards (M5 — denominator context).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatsCards } from './StatsCards';
import { validParticipant } from '../tests/helpers/participants';
import type { Participant } from '../types';

const makeParticipant = (overrides: Partial<Participant>): Participant =>
  validParticipant(overrides);

describe('StatsCards — M5 denominator context', () => {
  it('shows discapacidad prevalence as n/universe', () => {
    const data: Participant[] = [
      // 3 with valid discapacidad data: 1 with real disability, 2 with 'Ninguna'
      makeParticipant({ id: 1, discapacidades: 'Visual' }),
      makeParticipant({ id: 2, discapacidades: 'Ninguna' }),
      makeParticipant({ id: 3, discapacidades: 'Ninguna' }),
      // 2 with N/D — excluded from universe
      makeParticipant({ id: 4, discapacidades: 'N/D' }),
      makeParticipant({ id: 5, discapacidades: 'N/A' }),
    ];

    const { container } = render(
      <StatsCards data={data} totalItems={5} />
    );

    // Should show "1 / 3 (33%)"
    expect(container.textContent).toContain('Discapacidad');
    expect(container.textContent).toContain('/ 3');
    expect(container.textContent).toContain('33%');
  });

  it('shows enfermedad prevalence as n/universe', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, enfermedades: 'Asma' }),
      makeParticipant({ id: 2, enfermedades: 'Ninguna' }),
      makeParticipant({ id: 3, enfermedades: null }),
    ];

    const { container } = render(
      <StatsCards data={data} totalItems={3} />
    );

    // 2 in universe (id 1 + id 2), 1 with real value
    expect(container.textContent).toContain('Enfermedad');
    expect(container.textContent).toContain('/ 2');
  });
});
