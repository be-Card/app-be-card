import api from './api';
import {
  BeersListResponse,
  BeerDetailResponse,
  BeerStylesResponse,
  CreateBeerRequest,
  UpdateBeerRequest,
  CreateBeerPriceRequest,
  BeerFilters,
  CervezaBackend,
  PrecioCervezaBackend,
} from '../types';

export class CervezaAPI {
  // Obtener lista de cervezas con filtros y paginación
  static async getCervezas(
    page: number = 1,
    size: number = 10,
    filters: BeerFilters = {}
  ): Promise<BeersListResponse> {
    const apiParams: Record<string, string> = {
      page: page.toString(),
      size: size.toString(),
    };

    const search = filters.search ?? filters.nombre;
    if (search) apiParams.search = String(search);
    if (filters.estilo_id !== undefined) apiParams.estilo_id = String(filters.estilo_id);
    if (filters.activo !== undefined) apiParams.activo = String(filters.activo);
    if (filters.destacado !== undefined) apiParams.destacado = String(filters.destacado);
    if (filters.order_dir) apiParams.order_dir = String(filters.order_dir);

    const params = new URLSearchParams(apiParams);

    const response = await api.get(`/cervezas?${params}`);
    return response.data;
  }

  // Obtener cerveza por ID
  static async getCervezaById(id: number): Promise<BeerDetailResponse> {
    const response = await api.get(`/cervezas/${id}`);
    return response.data;
  }

  // Crear nueva cerveza
  static async createCerveza(data: CreateBeerRequest): Promise<CervezaBackend> {
    const response = await api.post('/cervezas', data);
    return response.data;
  }

  // Actualizar cerveza
  static async updateCerveza(id: number, data: UpdateBeerRequest): Promise<CervezaBackend> {
    const response = await api.put(`/cervezas/${id}`, data);
    return response.data;
  }

  // Eliminar cerveza
  static async deleteCerveza(id: number): Promise<void> {
    await api.delete(`/cervezas/${id}`);
  }

  // Obtener precio actual de una cerveza
  static async getPrecioActual(cervezaId: number): Promise<number> {
    const response = await api.get(`/cervezas/${cervezaId}/precio-actual`);
    return response.data.precio;
  }

  // Obtener stock total de una cerveza
  static async getStockTotal(cervezaId: number): Promise<number> {
    const response = await api.get(`/cervezas/${cervezaId}/stock-total`);
    return response.data.stock_total;
  }

  // Crear nuevo precio para una cerveza
  static async createPrecioCerveza(data: CreateBeerPriceRequest): Promise<PrecioCervezaBackend> {
    const response = await api.post('/cervezas/precios', data);
    return response.data;
  }

  // Obtener todos los estilos de cerveza
  static async getEstilosCerveza(): Promise<BeerStylesResponse> {
    const response = await api.get('/cervezas/estilos');
    return response.data;
  }

  static async createEstiloCerveza(data: { estilo: string; descripcion?: string | null; origen?: string | null }) {
    const response = await api.post('/cervezas/estilos', data);
    return response.data;
  }

  static async deleteEstiloCerveza(estiloId: number): Promise<void> {
    await api.delete(`/cervezas/estilos/${estiloId}`);
  }

  // Buscar cervezas por nombre
  static async searchCervezas(query: string): Promise<CervezaBackend[]> {
    const response = await api.get(`/cervezas/search?q=${encodeURIComponent(query)}`);
    return response.data.cervezas;
  }

  // Obtener cervezas activas (para seleccionar en equipos)
  static async getCervezasActivas(): Promise<CervezaBackend[]> {
    const response = await api.get('/cervezas?activo=true&size=100');
    return response.data.cervezas;
  }
}

export default CervezaAPI;
