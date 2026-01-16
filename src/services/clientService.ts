import api from './api';
import type {
  Client,
  ClientDetailResponse,
  ClientListResponse,
  ClientLoyaltyResponse,
  ClientOrdersResponse,
  ClientPaymentMethodsResponse,
  ClientStatsResponse,
  ClientSummary,
  EditClientFormData,
  ClientRewardsResponse,
} from '../types';

export interface ClientListParams {
  page?: number;
  limit?: number;
  status?: string; // 'Activo' | 'Inactivo'
  loyalty_level?: string;
  search?: string;
  sort_by?: 'name' | 'join_date' | 'total_spent' | 'loyalty_points';
  sort_order?: 'asc' | 'desc';
}

class ClientService {
  async getClients(params: ClientListParams = {}): Promise<ClientListResponse> {
    const response = await api.get<ClientListResponse>('/clients/', { params });
    return response.data;
  }

  async getClientById(clientId: string | number): Promise<ClientDetailResponse> {
    const response = await api.get<ClientDetailResponse>(`/clients/${clientId}`);
    return response.data;
  }

  async updateClient(clientId: string | number, clientData: EditClientFormData): Promise<ClientDetailResponse> {
    const updateData: Record<string, unknown> = {
      name: clientData.name || undefined,
      email: clientData.email || undefined,
      phone: clientData.phone || undefined,
      address: clientData.address || undefined,
      gender: clientData.gender || undefined,
      birthDate: clientData.birthDate || undefined,
    };
    Object.entries(updateData).forEach(([key, value]) => value === undefined && delete updateData[key]);

    const response = await api.put<ClientDetailResponse>(`/clients/${clientId}`, updateData);
    return response.data;
  }

  async toggleClientStatus(clientId: string | number): Promise<{ message: string; client: unknown }> {
    const response = await api.patch<{ message: string; client: unknown }>(`/clients/${clientId}/status`, {});
    return response.data;
  }

  async getClientStats(clientId: string | number): Promise<ClientStatsResponse> {
    const response = await api.get<ClientStatsResponse>(`/clients/${clientId}/stats`);
    return response.data;
  }

  async getClientOrders(clientId: string | number, limit: number = 20): Promise<ClientOrdersResponse> {
    const response = await api.get<ClientOrdersResponse>(`/clients/${clientId}/orders`, {
      params: { limit }
    });
    return response.data;
  }

  async getClientLoyaltyHistory(clientId: string | number): Promise<ClientLoyaltyResponse> {
    const response = await api.get<ClientLoyaltyResponse>(`/clients/${clientId}/loyalty/history`);
    return response.data;
  }

  async getClientPaymentMethods(clientId: string | number): Promise<ClientPaymentMethodsResponse> {
    const response = await api.get<ClientPaymentMethodsResponse>(`/clients/${clientId}/payment-methods`);
    return response.data;
  }

  async getClientRewards(clientId: string | number): Promise<ClientRewardsResponse> {
    const response = await api.get<ClientRewardsResponse>(`/clients/${clientId}/rewards`);
    return response.data;
  }

  async redeemClientReward(clientId: string | number, premioId: number): Promise<{ currentPoints: number; level: string }> {
    const response = await api.post<{ currentPoints: number; level: string }>(`/clients/${clientId}/rewards/${premioId}/redeem`);
    return response.data;
  }

  async addClient(clientData: {
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    phone?: string;
    gender: string;
    birthDate: string;
    address?: string;
  }): Promise<ClientDetailResponse> {
    const payload = {
      name: `${clientData.firstName} ${clientData.lastName}`.trim(),
      email: clientData.email,
      age: clientData.age,
      phone: clientData.phone?.trim() || undefined,
      address: clientData.address?.trim() || undefined,
      gender: clientData.gender,
      birthDate: clientData.birthDate,
    };

    const response = await api.post<ClientDetailResponse>('/clients/', payload);
    return response.data;
  }

  convertSummaryToClient(summary: ClientSummary): Client {
    return {
      id: summary.id,
      name: summary.name,
      email: summary.email ?? null,
      phone: summary.phone ?? null,
      address: null,
      status: summary.status,
      loyaltyLevel: summary.loyaltyLevel,
      loyaltyPoints: summary.loyaltyPoints,
      totalOrders: summary.totalOrders,
      totalSpent: summary.totalSpent,
      balance: summary.balance,
      joinDate: summary.joinDate,
      lastOrder: summary.lastOrder ?? null,
      favoriteStyle: null,
    };
  }

  convertDetailResponseToClient(response: ClientDetailResponse): Client {
    const { client, stats, loyalty } = response;
    return {
      id: client.id,
      name: client.name,
      email: client.email ?? null,
      phone: client.phone ?? null,
      address: client.address ?? null,
      status: client.status,
      loyaltyLevel: loyalty.level,
      loyaltyPoints: loyalty.currentPoints,
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
      joinDate: client.joinDate,
      lastOrder: null,
      favoriteStyle: stats.favoriteStyle ?? null,
      age: client.age ?? null,
      gender: client.gender ?? null,
      birthDate: client.birthDate ?? null,
      verified: client.verified,
      lastLogin: client.lastLogin ?? null,
    };
  }

  convertClientToEditForm(client: Client): EditClientFormData {
    return {
      name: client.name,
      email: client.email ?? undefined,
      phone: client.phone ?? undefined,
      address: client.address ?? undefined,
      gender: client.gender ?? undefined,
      birthDate: client.birthDate ?? undefined,
    };
  }
}

export default new ClientService();
