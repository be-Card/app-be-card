import api from './api';

export interface VentaDiaria {
  fecha: string;
  ingresos: number;
  litros_vendidos: number;
  transacciones: number;
  ticket_promedio: number;
}

export interface VentasReportResponse {
  periodo_inicio: string;
  periodo_fin: string;
  datos: VentaDiaria[];
  total_ingresos: number;
  total_litros: number;
  total_transacciones: number;
}

export interface ConsumoEstilo {
  estilo: string;
  litros: number;
  porcentaje: number;
  color: string;
}

export interface ConsumoReportResponse {
  periodo_inicio: string;
  periodo_fin: string;
  datos: ConsumoEstilo[];
  total_litros: number;
}

export interface ClienteNivel {
  nivel: string;
  cantidad: number;
  gasto_promedio: number;
  gasto_total: number;
}

export interface ClientesReportResponse {
  periodo_inicio: string;
  periodo_fin: string;
  datos: ClienteNivel[];
  total_clientes: number;
}

export interface ReportsQueryParams {
  days?: number;
  date_from?: string;
  date_to?: string;
}

const reportsService = {
  /**
   * Obtener reporte de ventas diarias
   * @param days Número de días para el período (default: 30)
   */
  getVentasReport: async (params: ReportsQueryParams = { days: 30 }): Promise<VentasReportResponse> => {
    const response = await api.get<VentasReportResponse>(`/reports/ventas`, {
      params
    });
    return response.data;
  },

  /**
   * Obtener reporte de consumo por estilo
   * @param days Número de días para el período (default: 30)
   */
  getConsumoReport: async (params: ReportsQueryParams = { days: 30 }): Promise<ConsumoReportResponse> => {
    const response = await api.get<ConsumoReportResponse>(`/reports/consumo`, {
      params
    });
    return response.data;
  },

  /**
   * Obtener reporte de segmentación de clientes
   * @param days Número de días para el período (default: 30)
   */
  getClientesReport: async (params: ReportsQueryParams = { days: 30 }): Promise<ClientesReportResponse> => {
    const response = await api.get<ClientesReportResponse>(`/reports/clientes`, {
      params
    });
    return response.data;
  },
};

export default reportsService;
