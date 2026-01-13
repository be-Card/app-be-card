import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import ProtectedRoute from '../ProtectedRoute';
import { useStore } from '../../store/useStore';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn()
}));

const mockedUseStore = vi.mocked(useStore);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedUseStore.mockReset();
  });

  it('redirige a /login cuando requiere auth y no hay sesión', () => {
    mockedUseStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true
    });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>Privado</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('redirige a /dashboard cuando es público y hay sesión', () => {
    mockedUseStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <div>Login</div>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
