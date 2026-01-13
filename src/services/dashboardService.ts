import api from './api';

export interface DashboardKPIs {
  periodo_dias: number;
  total_ventas: number;
  num_transacciones: number;
  ticket_promedio: number;
  clientes_activos: number;
  cervezas_activas: number;
  equipos_activos: number;
  cambio_ventas_porcentaje: number;
}

export interface VentasPorDia {
  periodo_dias: number;
  datos: Array<{
    fecha: string;
    total: number;
    cantidad: number;
  }>;
}

export interface CervezaPopular {
  nombre: string;
  tipo: string;
  total_ml: number;
  total_ventas: number;
  num_ventas: number;
}

export interface ClienteTop {
  nombre_completo: string;
  email: string;
  codigo_cliente: string;
  total_gastado: number;
  num_compras: number;
  nivel?: string;
}

export interface ResumenEquipos {
  total_equipos: number;
  por_estado: Array<{
    estado: string;
    cantidad: number;
  }>;
}

export interface DashboardKPIsDia {
  ingresos_dia: number;
  ingresos_cambio_pct: number;
  litros_servidos: number;
  litros_cambio_pct: number;
  clientes_unicos: number;
  clientes_cambio_pct: number;
  consumo_promedio: number;
  consumo_cambio_pct: number;
}

export interface DistribucionEstilo {
  periodo_dias: number;
  datos: Array<{
    estilo: string;
    litros: number;
    porcentaje: number;
  }>;
}

export interface CanillaDashboard {
  id: number;
  nombre: string;
  cerveza: string;
  nivel_pct: number;
  estado: 'active' | 'warning' | 'critical';
}

export interface MetodosPagoHoy {
  total: number;
  metodos: Array<{
    metodo: string;
    monto: number;
    porcentaje: number;
  }>;
}

const dashboardService = {
  /**
   * Obtener KPIs principales del dashboard
   * @param days Número de días para el período (default: 30)
   */
  getKPIs: async (days: number = 30): Promise<DashboardKPIs> => {
    const response = await api.get<DashboardKPIs>(`/dashboard/kpis`, {
      params: { days }
    });
    return response.data;
  },

  /**
   * Obtener ventas agrupadas por día
   * @param days Número de días para el período (default: 30)
   */
  getVentasPorDia: async (days: number = 30): Promise<VentasPorDia> => {
    const response = await api.get<VentasPorDia>(`/dashboard/ventas-por-dia`, {
      params: { days }
    });
    return response.data;
  },

  /**
   * Obtener las cervezas más vendidas
   * @param days Número de días para el período (default: 30)
   * @param limit Número máximo de resultados (default: 10)
   */
  getCervezasPopulares: async (days: number = 30, limit: number = 10): Promise<{ periodo_dias: number; cervezas: CervezaPopular[] }> => {
    const response = await api.get<{ periodo_dias: number; cervezas: CervezaPopular[] }>(`/dashboard/cervezas-populares`, {
      params: { days, limit }
    });
    return response.data;
  },

  /**
   * Obtener los clientes con mayor consumo
   * @param days Número de días para el período (default: 30)
   * @param limit Número máximo de resultados (default: 10)
   */
  getClientesTop: async (days: number = 30, limit: number = 10): Promise<{ periodo_dias: number; clientes: ClienteTop[] }> => {
    const response = await api.get<{ periodo_dias: number; clientes: ClienteTop[] }>(`/dashboard/clientes-top`, {
      params: { days, limit }
    });
    return response.data;
  },

  /**
   * Obtener resumen del estado de los equipos
   */
  getResumenEquipos: async (): Promise<ResumenEquipos> => {
    const response = await api.get<ResumenEquipos>(`/dashboard/resumen-equipos`);
    return response.data;
  },

  getKPIsDia: async (): Promise<DashboardKPIsDia> => {
    const response = await api.get<DashboardKPIsDia>(`/dashboard/kpis-dia`);
    return response.data;
  },

  getDistribucionEstilo: async (days: number = 30): Promise<DistribucionEstilo> => {
    const response = await api.get<DistribucionEstilo>(`/dashboard/distribucion-estilo`, {
      params: { days }
    });
    return response.data;
  },

  getCanillas: async (limit: number = 6): Promise<{ canillas: CanillaDashboard[] }> => {
    const response = await api.get<{ canillas: CanillaDashboard[] }>(`/dashboard/canillas`, {
      params: { limit }
    });
    return response.data;
  },

  getMetodosPagoHoy: async (): Promise<MetodosPagoHoy> => {
    const response = await api.get<MetodosPagoHoy>(`/dashboard/metodos-pago-hoy`);
    return response.data;
  },
};

export default dashboardService;
