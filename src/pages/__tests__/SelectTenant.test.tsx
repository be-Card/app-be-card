import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import SelectTenant from '../SelectTenant';
import tenantService from '../../services/tenantService';

vi.mock('../../services/tenantService', () => ({
  default: {
    getMyTenants: vi.fn()
  }
}));

describe('SelectTenant', () => {
  beforeEach(() => {
    localStorage.removeItem('tenant_slug');
    vi.clearAllMocks();
  });

  it('auto-selecciona cuando sólo hay un tenant', async () => {
    vi.mocked(tenantService.getMyTenants).mockResolvedValue([
      { id: 1, id_ext: 'x', nombre: 'Mi Bar', slug: 'mi-bar' }
    ]);

    render(
      <MemoryRouter initialEntries={['/select-tenant']}>
        <Routes>
          <Route path="/select-tenant" element={<SelectTenant />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    expect(localStorage.getItem('tenant_slug')).toBe('mi-bar');
  });
});

