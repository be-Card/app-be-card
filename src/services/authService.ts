import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_link?: string;
  expires_at?: string;
}

export interface RegisterRequest {
  nombre_usuario: string;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  sexo: 'FEMENINO' | 'MASCULINO';
  fecha_nacimiento: string;
  telefono?: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  verification_link?: string;
  verification_expires_at?: string;
}

export interface User {
  id: number;
  id_ext: string;
  nombre_usuario: string;
  email: string;
  nombres: string;
  apellidos: string;
  sexo: string;
  fecha_nacimiento: string;
  telefono?: string;
  activo: boolean;
  verificado: boolean;
  fecha_creacion: string;
  ultimo_login?: string;
  intentos_login_fallidos: number;
  roles?: Array<{
    id: number;
    tipo_rol_usuario: {
      id: number;
      nombre: string;
      descripcion?: string;
    };
    asignado_el: string;
  }>;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login-json', {
      email: credentials.email,
      password: credentials.password
    });

    // Guardar token en localStorage
    localStorage.setItem('access_token', response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        // Token inválido o expirado
        return null;
      }
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
    return response.data;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/verify-email', { token });
    return response.data;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/resend-verification', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

export default new AuthService();
