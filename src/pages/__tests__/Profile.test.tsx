import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../Profile';
import profileService from '../../services/profileService';

describe('Profile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and displays profile data from API', async () => {
    vi.spyOn(profileService, 'getMe').mockResolvedValue({
      id: 1,
      nombres: 'Maria',
      apellidos: 'Salazar',
      email: 'admin@becard.com',
      telefono: '+54 11 1234 5678',
      direccion: 'Av. Corrientes 1234, CABA',
      sexo: null,
      fecha_nac: null,
      fecha_creacion: new Date('2024-01-15').toISOString(),
      roles: ['Administrador'],
      professional: {
        puesto: 'Gerente General',
        departamento: 'Administración',
        fecha_ingreso: '2024-01-15',
        id_empleado: 'EMP-001',
      },
      stats: { sessions: 10, activity: 'Alto', reports: 0 },
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Maria Salazar')).toBeInTheDocument();
    });

    expect(screen.getByText('Av. Corrientes 1234, CABA')).toBeInTheDocument();
  });
});
