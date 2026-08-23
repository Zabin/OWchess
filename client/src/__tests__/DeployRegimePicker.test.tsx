import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { DeployRegimePicker } from '../components/DeployRegimePicker.js';

describe('DeployRegimePicker (IP-9062, closes part of BL-0062)', () => {
  afterEach(() => cleanup());

  it('offers only the template\'s own regimeAffinity, not the full 9-value taxonomy', () => {
    render(
      <DeployRegimePicker
        template={{ templateId: 'wide-area-sda-radar', regimeAffinity: ['LEO-EQUATORIAL', 'LEO-PROGRADE'] }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const select = screen.getByTestId('deploy-regime-select') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['LEO-EQUATORIAL', 'LEO-PROGRADE']);
  });

  it('submitting calls onSubmit with the selected regime', () => {
    const onSubmit = vi.fn();
    render(
      <DeployRegimePicker
        template={{ templateId: 'wide-area-sda-radar', regimeAffinity: ['LEO-POLAR'] }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('deploy-regime-submit'));
    expect(onSubmit).toHaveBeenCalledWith('LEO-POLAR');
  });

  it('cancelling calls onCancel', () => {
    const onCancel = vi.fn();
    render(
      <DeployRegimePicker
        template={{ templateId: 'wide-area-sda-radar', regimeAffinity: ['LEO-POLAR'] }}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByTestId('deploy-regime-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
