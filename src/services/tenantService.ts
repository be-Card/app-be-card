import api from './api';

export interface Tenant {
  id: number;
  id_ext: string;
  nombre: string;
  slug: string;
}

class TenantService {
  async getMyTenants(): Promise<Tenant[]> {
    const response = await api.get<Tenant[]>('/tenants/me');
    return response.data;
  }
}

export default new TenantService();
