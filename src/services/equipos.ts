import api from './api';
import {
  EquipmentListResponse,
  EquipmentDetailResponse,
  BarrelTypesResponse,
  EquipmentStatesResponse,
  LowStockEquipmentResponse,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  ChangeBeerRequest,
  EquipmentFilters,
  EquipoBackend,
  PuntoVentaListItem,
} from '../types';

export class EquipoAPI {
  // Obtener lista de equipos con filtros y paginación
  static async getEquipos(
    page: number = 1,
    size: number = 10,
    filters: EquipmentFilters = {}
  ): Promise<EquipmentListResponse> {
    const apiParams: Record<string, string> = {
      page: page.toString(),
      size: size.toString(),
    };

    const search = filters.search ?? filters.nombre;
    if (search) apiParams.search = String(search);
    if (filters.permite_ventas !== undefined) apiParams.permite_ventas = String(filters.permite_ventas);
    if (filters.order_dir) apiParams.order_dir = String(filters.order_dir);

    const params = new URLSearchParams(apiParams);

    const response = await api.get(`/equipos/?${params}`);
    return response.data;
  }

  // Obtener equipo por ID
  static async getEquipoById(id: number): Promise<EquipmentDetailResponse> {
    const response = await api.get(`/equipos/${id}`);
    return response.data;
  }

  // Crear nuevo equipo
  static async createEquipo(data: CreateEquipmentRequest): Promise<EquipoBackend> {
    const response = await api.post('/equipos/', data);
    return response.data;
  }

  // Actualizar equipo
  static async updateEquipo(id: number, data: UpdateEquipmentRequest): Promise<EquipoBackend> {
    const response = await api.put(`/equipos/${id}`, data);
    return response.data;
  }

  // Eliminar equipo
  static async deleteEquipo(equipoId: number): Promise<void> {
    await api.delete(`/equipos/${equipoId}`);
  }

  // Cambiar cerveza en un equipo
  static async cambiarCerveza(equipoId: number, data: ChangeBeerRequest): Promise<EquipoBackend> {
    const response = await api.put(`/equipos/${equipoId}/cambiar-cerveza`, data);
    return response.data;
  }

  // Alternar estado del equipo (activo/inactivo)
  static async toggleEstadoEquipo(equipoId: number): Promise<EquipoBackend> {
    const response = await api.put(`/equipos/${equipoId}/toggle-estado`);
    return response.data;
  }

  // Actualizar temperatura del equipo
  static async updateTemperatura(equipoId: number, temperatura: number): Promise<EquipoBackend> {
    const response = await api.put(`/equipos/${equipoId}/temperatura`, { temperatura });
    return response.data;
  }

  // Obtener equipos con stock bajo
  static async getEquiposBajoStock(threshold: number = 20): Promise<LowStockEquipmentResponse> {
    const response = await api.get(`/equipos/bajo-stock?threshold=${threshold}`);
    return response.data;
  }

  // Obtener todos los tipos de barril
  static async getTiposBarril(): Promise<BarrelTypesResponse> {
    const response = await api.get('/equipos/tipos-barril');
    return response.data;
  }

  // Obtener todos los estados de equipo
  static async getEstadosEquipo(): Promise<EquipmentStatesResponse> {
    const response = await api.get('/equipos/estados-equipo');
    return response.data;
  }

  static async getPuntosVenta(): Promise<PuntoVentaListItem[]> {
    const response = await api.get('/equipos/puntos-venta');
    return response.data;
  }

  // Buscar equipos por nombre
  static async searchEquipos(query: string): Promise<EquipoBackend[]> {
    const response = await api.get(`/equipos/search?q=${encodeURIComponent(query)}`);
    return response.data.equipos;
  }

  // Obtener equipos por ubicación
  static async getEquiposPorUbicacion(ubicacion: string): Promise<EquipoBackend[]> {
    const response = await api.get(`/equipos/?ubicacion=${encodeURIComponent(ubicacion)}&size=100`);
    return response.data.equipos;
  }

  // Obtener estadísticas de equipos
  static async getEstadisticasEquipos(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    bajo_stock: number;
    promedio_nivel: number;
    promedio_temperatura: number;
  }> {
    const response = await api.get('/equipos/estadisticas');
    return response.data;
  }

  // Calcular porcentaje de nivel de barril
  static calcularPorcentajeNivel(nivelBarril: number): number {
    return Math.max(0, Math.min(100, nivelBarril));
  }

  // Determinar estado del nivel de barril
  static determinarEstadoNivel(porcentaje: number): 'alto' | 'medio' | 'bajo' | 'critico' {
    if (porcentaje >= 70) return 'alto';
    if (porcentaje >= 40) return 'medio';
    if (porcentaje >= 20) return 'bajo';
    return 'critico';
  }

  // Calcular volumen actual del barril
  static calcularVolumenActual(nivelBarril: number, capacidadBarril: number): number {
    return (nivelBarril / 100) * capacidadBarril;
  }

  // ===== NUEVOS ENDPOINTS DE ALERTAS =====

  // Obtener alertas activas de stock
  static async getAlertasActivas(): Promise<{
    total_alertas: number;
    alertas_criticas: { count: number; alertas: any[] };
    alertas_medias: { count: number; alertas: any[] };
    alertas_bajas: { count: number; alertas: any[] };
    timestamp: string;
  }> {
    const response = await api.get('/equipos/alertas');
    return response.data;
  }

  // Verificar y obtener todas las alertas de stock
  static async verificarAlertasStock(): Promise<{
    alertas: any[];
    total: number;
  }> {
    const response = await api.get('/equipos/alertas/verificar');
    return response.data;
  }

  // Obtener equipos que requieren atención inmediata
  static async getEquiposAtencionInmediata(): Promise<{
    total: number;
    mensaje: string;
    equipos: any[];
  }> {
    const response = await api.get('/equipos/alertas/atencion');
    return response.data;
  }

  // Simular consumo de barril y verificar alertas
  static async simularConsumoBarril(equipoId: number, litrosConsumidos: number): Promise<{
    equipo_id: number;
    nivel_actual: number;
    nivel_despues_consumo: number;
    litros_consumidos: number;
    nueva_capacidad: number;
    generaria_alerta: boolean;
    alerta: any | null;
  }> {
    const response = await api.post(`/equipos/${equipoId}/simular-consumo`, {
      litros_consumidos: litrosConsumidos
    });
    return response.data;
  }

  // Cambiar estado de equipo con motivo
  static async cambiarEstadoEquipo(equipoId: number, nuevoEstadoId: number, motivo?: string): Promise<EquipoBackend> {
    const response = await api.put(`/equipos/${equipoId}/estado`, {
      id_estado_equipo: nuevoEstadoId,
      motivo: motivo
    });
    return response.data;
  }
}

export default EquipoAPI;
