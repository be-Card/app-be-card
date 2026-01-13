import api from './api';
import {
  ReglaListResponse,
  ReglaDePrecioBackend,
  ReglaDePrecioCreateRequest,
  ReglaDePrecioUpdateRequest,
  ConsultaPrecioRequest,
  CalculoPrecioResponse,
} from '../types';

export class PricingAPI {
  static async getReglas(params: {
    page?: number;
    per_page?: number;
    search?: string;
    activo?: boolean;
    estado?: 'Activa' | 'Programada' | 'Inactiva';
    order_dir?: 'asc' | 'desc';
  }): Promise<ReglaListResponse> {
    const { page = 1, per_page = 10, search, activo, estado, order_dir } = params || {};
    const res = await api.get<ReglaListResponse>('/pricing/reglas', {
      params: { page, per_page, search, activo, estado, order_dir },
    });
    return res.data;
  }

  static async getRegla(id: number): Promise<ReglaDePrecioBackend> {
    const res = await api.get<ReglaDePrecioBackend>(`/pricing/reglas/${id}`);
    return res.data;
  }

  static async createRegla(data: ReglaDePrecioCreateRequest): Promise<ReglaDePrecioBackend> {
    const res = await api.post<ReglaDePrecioBackend>('/pricing/reglas', data);
    return res.data;
  }

  static async updateRegla(id: number, data: ReglaDePrecioUpdateRequest): Promise<ReglaDePrecioBackend> {
    const res = await api.patch<ReglaDePrecioBackend>(`/pricing/reglas/${id}`, data);
    return res.data;
  }

  static async deleteRegla(id: number): Promise<void> {
    await api.delete(`/pricing/reglas/${id}`);
  }

  static async calcularPrecio(data: ConsultaPrecioRequest): Promise<CalculoPrecioResponse> {
    const res = await api.post<CalculoPrecioResponse>('/pricing/calcular', data);
    return res.data;
  }
}

export default PricingAPI;
