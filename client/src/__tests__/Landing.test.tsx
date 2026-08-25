import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { Landing } from '../components/Landing.js';

describe('Landing (IP-9038, closes BL-0055)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('"Create Game" calls the create endpoint and enters with the returned ids', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ sessionId: 's1', playerId: 'p1' }),
    });
    const onEnter = vi.fn();
    render(<Landing onEnter={onEnter} />);

    await act(async () => fireEvent.click(screen.getByTestId('create-game')));

    expect(fetch).toHaveBeenCalledWith('/api/sessions', { method: 'POST' });
    await waitFor(() => expect(onEnter).toHaveBeenCalledWith('s1', 'p1'));
  });

  it('"Join Game" calls the join endpoint with the entered sessionId', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ playerId: 'p2' }),
    });
    const onEnter = vi.fn();
    render(<Landing onEnter={onEnter} />);

    fireEvent.change(screen.getByTestId('join-session-input'), { target: { value: 's1' } });
    await act(async () => fireEvent.click(screen.getByTestId('join-game')));

    expect(fetch).toHaveBeenCalledWith('/api/sessions/s1/join', { method: 'POST' });
    await waitFor(() => expect(onEnter).toHaveBeenCalledWith('s1', 'p2'));
  });

  it('a join failure shows the server\'s own rejection reason, not a generic error', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ reason: 'session already has two players' }),
    });
    const onEnter = vi.fn();
    render(<Landing onEnter={onEnter} />);

    fireEvent.change(screen.getByTestId('join-session-input'), { target: { value: 's1' } });
    await act(async () => fireEvent.click(screen.getByTestId('join-game')));

    await waitFor(() =>
      expect(screen.getByTestId('landing-error').textContent).toBe('session already has two players')
    );
    expect(onEnter).not.toHaveBeenCalled();
  });
});
