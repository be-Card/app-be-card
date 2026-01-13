import api from './api';

export interface UserPreferences {
  notifications_email_sales: boolean;
  notifications_email_inventory: boolean;
  notifications_email_clients: boolean;
  notifications_push_critical: boolean;
  notifications_push_reports: boolean;
  language: string;
  date_format: string;
  theme: string;
}

export interface UserPreferencesResponse {
  user_id: number;
  preferences: UserPreferences;
  message: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface Session {
  id: string;
  device: string;
  ip: string;
  last_active: string;
  location: string;
  current: boolean;
}

export interface ActiveSessionsResponse {
  user_id: number;
  sessions: Session[];
  total: number;
}

const settingsService = {
  /**
   * Obtener preferencias del usuario actual
   */
  getPreferences: async (): Promise<UserPreferencesResponse> => {
    const response = await api.get<UserPreferencesResponse>('/settings/preferences');
    return response.data;
  },

  /**
   * Actualizar preferencias del usuario
   */
  updatePreferences: async (preferences: UserPreferences): Promise<UserPreferencesResponse> => {
    const response = await api.put<UserPreferencesResponse>('/settings/preferences', preferences);
    return response.data;
  },

  /**
   * Cambiar contraseña del usuario
   */
  changePassword: async (passwordData: ChangePasswordRequest): Promise<{ message: string; user_id: number }> => {
    const response = await api.post<{ message: string; user_id: number }>(
      '/settings/change-password',
      passwordData
    );
    return response.data;
  },

  /**
   * Obtener sesiones activas del usuario
   */
  getActiveSessions: async (): Promise<ActiveSessionsResponse> => {
    const response = await api.get<ActiveSessionsResponse>('/settings/active-sessions');
    return response.data;
  },

  /**
   * Cerrar una sesión específica
   */
  closeSession: async (sessionId: string): Promise<{ message: string; user_id: number }> => {
    const response = await api.delete<{ message: string; user_id: number }>(
      `/settings/sessions/${sessionId}`
    );
    return response.data;
  },
};

export default settingsService;
