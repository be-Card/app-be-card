import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import Settings from '../Settings';
import settingsService from '../../services/settingsService';

describe('Settings', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads preferences and sessions from API', async () => {
    vi.spyOn(settingsService, 'getPreferences').mockResolvedValue({
      user_id: 1,
      preferences: {
        notifications_email_sales: true,
        notifications_email_inventory: true,
        notifications_email_clients: true,
        notifications_push_critical: true,
        notifications_push_reports: true,
        language: 'es',
        date_format: 'YYYY-MM-DD',
        theme: 'dark',
      },
      message: 'ok',
    });

    vi.spyOn(settingsService, 'getActiveSessions').mockResolvedValue({
      user_id: 1,
      total: 2,
      sessions: [
        { id: '1', device: 'Chrome en Windows', ip: '', last_active: new Date().toISOString(), location: '—', current: true },
        { id: '2', device: 'Firefox en MacOS', ip: '', last_active: new Date().toISOString(), location: '—', current: false },
      ],
    });

    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Configuración Regional')).toBeInTheDocument();
    });

    expect(screen.getByText('Chrome en Windows')).toBeInTheDocument();
    expect(screen.getByText('Firefox en MacOS')).toBeInTheDocument();
  });

  it('closes a non-current session', async () => {
    vi.spyOn(settingsService, 'getPreferences').mockResolvedValue({
      user_id: 1,
      preferences: {
        notifications_email_sales: true,
        notifications_email_inventory: true,
        notifications_email_clients: true,
        notifications_push_critical: true,
        notifications_push_reports: true,
        language: 'es',
        date_format: 'YYYY-MM-DD',
        theme: 'dark',
      },
      message: 'ok',
    });

    const getActiveSessions = vi.spyOn(settingsService, 'getActiveSessions');
    getActiveSessions.mockResolvedValueOnce({
      user_id: 1,
      total: 2,
      sessions: [
        { id: '1', device: 'Chrome en Windows', ip: '', last_active: new Date().toISOString(), location: '—', current: true },
        { id: '2', device: 'Firefox en MacOS', ip: '', last_active: new Date().toISOString(), location: '—', current: false },
      ],
    });
    getActiveSessions.mockResolvedValueOnce({
      user_id: 1,
      total: 1,
      sessions: [
        { id: '1', device: 'Chrome en Windows', ip: '', last_active: new Date().toISOString(), location: '—', current: true },
      ],
    });

    vi.spyOn(settingsService, 'closeSession').mockResolvedValue({ message: 'ok', user_id: 1 });

    render(<Settings />);

    const closeButton = await screen.findByText('Cerrar');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(settingsService.closeSession).toHaveBeenCalledWith('2');
    });
  });

  it('submits change password', async () => {
    vi.spyOn(settingsService, 'getPreferences').mockResolvedValue({
      user_id: 1,
      preferences: {
        notifications_email_sales: true,
        notifications_email_inventory: true,
        notifications_email_clients: true,
        notifications_push_critical: true,
        notifications_push_reports: true,
        language: 'es',
        date_format: 'YYYY-MM-DD',
        theme: 'dark',
      },
      message: 'ok',
    });

    vi.spyOn(settingsService, 'getActiveSessions').mockResolvedValue({
      user_id: 1,
      total: 0,
      sessions: [],
    });

    vi.spyOn(settingsService, 'changePassword').mockResolvedValue({ message: 'ok', user_id: 1 });

    render(<Settings />);

    const titles = await screen.findAllByText('Cambiar Contraseña');
    expect(titles.length).toBeGreaterThan(0);

    const inputs = screen.getAllByPlaceholderText('Escribe aquí...');
    fireEvent.change(inputs[0], { target: { value: 'OldPass1!' } });
    fireEvent.change(inputs[1], { target: { value: 'NewPass1!' } });

    const submitButtons = screen.getAllByRole('button', { name: /Actualizar Contraseña/i });
    const submit = submitButtons.find((b) => !b.hasAttribute('disabled')) || submitButtons[0];
    fireEvent.click(submit);

    await waitFor(() => {
      expect(settingsService.changePassword).toHaveBeenCalledWith({
        current_password: 'OldPass1!',
        new_password: 'NewPass1!',
      });
    });
  });
});
