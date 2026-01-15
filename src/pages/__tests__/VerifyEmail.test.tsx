import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

const verifyEmailMock = vi.fn();

vi.mock('../../services/authService', () => ({
  default: {
    verifyEmail: (...args: any[]) => verifyEmailMock(...args),
  },
}));

describe('VerifyEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    verifyEmailMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('redirige al login tras verificación exitosa', async () => {
    vi.useFakeTimers();
    verifyEmailMock.mockResolvedValue({ message: 'Email verificado correctamente.' } as any);

    const { MemoryRouter, Routes, Route } = await import('react-router-dom');
    const { default: VerifyEmail } = await import('../VerifyEmail');

    render(
      <MemoryRouter initialEntries={['/verify-email?token=token_valido_1234567890']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Email verificado correctamente.')).toBeInTheDocument();
    expect(screen.getByText(/Redirigiendo en/i)).toBeInTheDocument();

    for (let i = 0; i < 4; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    expect(screen.getByText('Login page')).toBeInTheDocument();
  }, 10000);
});
