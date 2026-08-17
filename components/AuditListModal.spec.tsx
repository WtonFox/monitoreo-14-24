/**
 * Component spec for AuditListModal (AD-1/AD-4, AUD-13).
 *
 * Verifica el contrato de cierre del modal genérico: renderiza title/count/
 * children, cierra por backdrop, por tecla Esc y por botón X, y restaura el
 * scroll-lock del body al desmontar. Usa `cleanup` en afterEach para que el
 * scroll-lock de un test no contamine el siguiente (setup global no limpia DOM).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { AuditListModal } from './AuditListModal';

afterEach(() => {
  cleanup();
});

const baseProps = {
  title: 'Duplicados de carga',
  icon: <span>i</span>,
  tone: 'bg-cyan-50 text-cyan-600',
};

describe('AuditListModal', () => {
  it('renderiza título, count y children', () => {
    const { getByRole, getByText } = render(
      <AuditListModal {...baseProps} count="5" onClose={vi.fn()}>
        <p>contenido</p>
      </AuditListModal>
    );
    expect(getByRole('dialog')).toBeTruthy();
    expect(getByText('Duplicados de carga')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('contenido')).toBeTruthy();
  });

  it('cierra al hacer clic en el backdrop (e.target === e.currentTarget)', () => {
    const onClose = vi.fn();
    const { container } = render(
      <AuditListModal {...baseProps} onClose={onClose}>
        <p>contenido</p>
      </AuditListModal>
    );
    const overlay = container.querySelector('[role="dialog"]');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra con la tecla Escape (keydown en window)', () => {
    const onClose = vi.fn();
    render(
      <AuditListModal {...baseProps} onClose={onClose}>
        <p>contenido</p>
      </AuditListModal>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra con el botón X', () => {
    const onClose = vi.fn();
    const { getByLabelText } = render(
      <AuditListModal {...baseProps} onClose={onClose}>
        <p>contenido</p>
      </AuditListModal>
    );
    fireEvent.click(getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('bloquea el scroll del body y lo restaura al desmontar', () => {
    const { unmount } = render(
      <AuditListModal {...baseProps} onClose={vi.fn()}>
        <p>contenido</p>
      </AuditListModal>
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
