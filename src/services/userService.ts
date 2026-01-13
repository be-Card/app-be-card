import api from './api';
import { User } from './authService';
import clientService from './clientService';

export interface UserListResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}

export interface UserUpdateRequest {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  password?: string;
}

export interface UserWithRoles extends User {
  roles: Array<{
    id: number;
    tipo_rol_usuario: {
      id: number;
      nombre: string;
      descripcion?: string;
    };
    asignado_el: string;
  }>;
  nivel?: {
    id: number;
    nivel: string;
    puntaje_minimo: number;
    puntaje_max?: number;
    beneficios?: string;
  };
}

class UserService {
  async getUsers(params?: {
    skip?: number;
    limit?: number;
    activo?: boolean;
  }): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>('/users/', { params });
    return response.data;
  }

  async getUserById(userId: string | number): Promise<UserWithRoles> {
    const response = await api.get<UserWithRoles>(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string | number, userData: UserUpdateRequest): Promise<User> {
    const response = await api.put<User>(`/users/${userId}`, userData);
    return response.data;
  }

  async createUser(userData: {
    nombre_usuario: string;
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    sexo: 'FEMENINO' | 'MASCULINO';
    fecha_nacimiento: string;
    telefono?: string;
  }): Promise<User> {
    const response = await api.post<User>('/users/', userData);
    return response.data;
  }

  async deleteUser(userId: string | number): Promise<void> {
    await api.delete(`/users/${userId}`);
  }

  async toggleUserStatus(userId: string | number): Promise<User> {
    const response = await api.patch<User>(`/users/${userId}/toggle-status`);
    return response.data;
  }

  // Método para convertir User del backend al formato Client del frontend
  convertUserToClient(user: User): any {
    return {
      id: user.id.toString(),
      name: `${user.nombres} ${user.apellidos}`,
      email: user.email,
      phone: user.telefono || '',
      address: '', // No disponible en el backend actual
      status: user.activo ? 'Activo' : 'Inactivo',
      totalOrders: 0, // Será calculado desde órdenes
      totalSpent: 0, // Será calculado desde órdenes
      favoriteStyle: '', // Será calculado desde órdenes
      joinDate: user.fecha_creacion.split('T')[0],
      lastOrder: user.ultimo_login?.split('T')[0] || '',
      loyaltyLevel: 'Bronce', // Por defecto, será calculado
      age: this.calculateAge(user.fecha_nacimiento),
      gender: user.sexo === 'MASCULINO' ? 'Masculino' : 'Femenino',
      birthDate: user.fecha_nacimiento.split('T')[0]
    };
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Métodos delegados al clientService para compatibilidad
  async getClients(params?: any) {
    return clientService.getClients(params);
  }

  async getClientById(clientId: string | number) {
    return clientService.getClientById(clientId);
  }

  async updateClient(clientId: string | number, clientData: any) {
    return clientService.updateClient(clientId, clientData);
  }

  async toggleClientStatus(clientId: string | number) {
    return clientService.toggleClientStatus(clientId);
  }

  async getClientStats(clientId: string | number) {
    return clientService.getClientStats(clientId);
  }

  async getClientOrders(clientId: string | number, limit?: number) {
    return clientService.getClientOrders(clientId, limit ?? 20);
  }

  async getClientLoyaltyHistory(clientId: string | number) {
    return clientService.getClientLoyaltyHistory(clientId);
  }

  async getClientPaymentMethods(clientId: string | number) {
    return clientService.getClientPaymentMethods(clientId);
  }
}

export default new UserService();