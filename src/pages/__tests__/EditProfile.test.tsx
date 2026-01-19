import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import EditProfile from '../EditProfile';
import profileService from '../../services/profileService';
import { useStore } from '../../store/useStore';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

const mockedUseStore = vi.mocked(useStore);

describe('EditProfile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedUseStore.mockReset();
    mockedUseStore.mockReturnValue({
      user: null,
      setUser: vi.fn(),
    } as any);
  });

  it('loads profile and submits update', async () => {
    vi.spyOn(profileService, 'getMe').mockResolvedValue({
      id: 1,
      nombres: 'Maria',
      apellidos: 'Salazar',
      email: 'admin@becard.com',
      telefono: '+54 11 1234 5678',
      direccion: 'Av. Corrientes 1234, CABA',
      avatar: null,
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

    const updateMe = vi.spyOn(profileService, 'updateMe').mockResolvedValue({
      id: 1,
      nombres: 'Maria',
      apellidos: 'Salazar',
      email: 'admin@becard.com',
      telefono: '+54 11 1234 5678',
      direccion: 'Av. Corrientes 1234, CABA',
      avatar: null,
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
        <EditProfile />
      </MemoryRouter>
    );

    await screen.findByText('Volver al Perfil');

    const phone = screen.getByPlaceholderText('+51 123456789');
    fireEvent.change(phone, { target: { value: '+54 11 9999 0000' } });

    const submit = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(updateMe).toHaveBeenCalled();
    });
  });
});
