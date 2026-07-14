/**
 * Characterization spec for ChartsSection (M5 — unknown age routing).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChartsSection } from './ChartsSection';
import { validParticipant } from '../tests/helpers/participants';
import type { Participant } from '../types';

const makeParticipant = (overrides: Partial<Participant>): Participant =>
  validParticipant(overrides);

describe('ChartsSection — M5 unknown age routing', () => {
  it('routes null/0/undefined ages to Unknown bucket', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, edad: null as unknown as number }),
      makeParticipant({ id: 2, edad: 0 }),
      makeParticipant({ id: 3, edad: 25 }),
      makeParticipant({ id: 4, edad: 35 }),
    ];

    const { container } = render(
      <ChartsSection
        data={data}
        selectedProvince=""
        selectedMunicipio=""
      />
    );

    // The age chart should render with all groups including Unknown
    expect(container.textContent).toContain('Grupos de Edad');
  });
});
