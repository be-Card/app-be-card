import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import PricingAndPromotions from '../../pages/PricingAndPromotions';
import PricingAPI from '../../services/pricing';

describe('PricingAndPromotions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and displays promotions from API', async () => {
    const mockGetReglas = vi.spyOn(PricingAPI, 'getReglas').mockResolvedValue({
      reglas: [
        {
          id: 1,
          id_ext: 'r1',
          nombre: 'Happy Hour General',
          descripcion: null,
          precio: null,
          esta_activo: true,
          prioridad: 'media',
          multiplicador: 0.85,
          fecha_hora_inicio: new Date().toISOString(),
          fecha_hora_fin: null,
          dias_semana: JSON.stringify(['lunes', 'martes']),
          creado_por: 1,
          creado_el: new Date().toISOString(),
          vigente: true,
          estado: 'Activa',
          alcance: 'Todas las cervezas',
          alcances: [],
        } as any,
      ],
      total: 1,
      page: 1,
      per_page: 6,
    } as any);

    render(<PricingAndPromotions />);

    await waitFor(() => {
      expect(screen.getByText(/Happy Hour General/i)).toBeInTheDocument();
    });

    mockGetReglas.mockRestore();
  });

  it('shows error message when API fails', async () => {
    const mockGetReglas = vi.spyOn(PricingAPI, 'getReglas').mockRejectedValue(new Error('network'));

    render(<PricingAndPromotions />);

    const errors = await screen.findAllByText(/Error al cargar promociones/i);
    expect(errors.length).toBeGreaterThan(0);

    mockGetReglas.mockRestore();
  });
});
