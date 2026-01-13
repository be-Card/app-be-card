import { useState, useCallback, useEffect } from 'react';
import { EquipoAPI } from '../services/equipos';

export interface AlertaStock {
  equipo_id: number;
  nombre_equipo: string;
  cerveza_nombre: string;
  nivel_porcentaje: number;
  tipo_alerta: 'critico' | 'medio' | 'bajo';
  mensaje: string;
  timestamp: string;
}

export interface AlertasResponse {
  alertas: AlertaStock[];
  total: number;
  mensaje?: string;
}

export interface SimulacionConsumo {
  equipo_id: number;
  litros_consumidos: number;
  nivel_actual: number;
  nivel_despues_consumo: number;
  nueva_capacidad: number;
  generaria_alerta: boolean;
  alerta: any | null;
}

export const useAlertas = () => {
  const [alertasActivas, setAlertasActivas] = useState<AlertaStock[]>([]);
  const [equiposAtencion, setEquiposAtencion] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAlertas, setTotalAlertas] = useState(0);

  // Obtener alertas activas
  const fetchAlertasActivas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await EquipoAPI.getAlertasActivas();
      
      if (response) {
        const alertas = [
          ...(response.alertas_criticas?.alertas || []),
          ...(response.alertas_medias?.alertas || []),
          ...(response.alertas_bajas?.alertas || [])
        ] as AlertaStock[];
        setAlertasActivas(alertas);
        setTotalAlertas(response.total_alertas || 0);
      } else {
        setAlertasActivas([]);
        setTotalAlertas(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al obtener alertas activas');
      setAlertasActivas([]);
      setTotalAlertas(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar todas las alertas de stock
  const verificarAlertasStock = useCallback(async (): Promise<AlertasResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await EquipoAPI.verificarAlertasStock();
      
      if (response && response.alertas) {
        setAlertasActivas(response.alertas);
        setTotalAlertas(response.total || 0);
      }
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al verificar alertas');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener equipos que requieren atención inmediata
  const fetchEquiposAtencionInmediata = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await EquipoAPI.getEquiposAtencionInmediata();
      
      if (response) {
        setEquiposAtencion(response.equipos || []);
      } else {
        setEquiposAtencion([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al obtener equipos que requieren atención');
      setEquiposAtencion([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Simular consumo de barril
  const simularConsumo = useCallback(async (equipoId: number, litros: number): Promise<SimulacionConsumo | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await EquipoAPI.simularConsumoBarril(equipoId, litros);
      
      // Después de simular, actualizar las alertas activas
      await fetchAlertasActivas();
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al simular consumo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchAlertasActivas]);

  // Obtener alertas por tipo
  const getAlertasPorTipo = useCallback((tipo: 'critico' | 'medio' | 'bajo') => {
    return alertasActivas.filter(alerta => alerta.tipo_alerta === tipo);
  }, [alertasActivas]);

  // Obtener alertas críticas
  const getAlertasCriticas = useCallback(() => {
    return getAlertasPorTipo('critico');
  }, [getAlertasPorTipo]);

  // Obtener alertas medias
  const getAlertasMedias = useCallback(() => {
    return getAlertasPorTipo('medio');
  }, [getAlertasPorTipo]);

  // Obtener alertas bajas
  const getAlertasBajas = useCallback(() => {
    return getAlertasPorTipo('bajo');
  }, [getAlertasPorTipo]);

  // Verificar si hay alertas críticas
  const hayAlertasCriticas = useCallback(() => {
    return alertasActivas.some(alerta => alerta.tipo_alerta === 'critico');
  }, [alertasActivas]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refrescar todas las alertas
  const refreshAlertas = useCallback(async () => {
    await Promise.all([
      fetchAlertasActivas(),
      fetchEquiposAtencionInmediata()
    ]);
  }, [fetchAlertasActivas, fetchEquiposAtencionInmediata]);

  // Cargar alertas al montar el componente
  useEffect(() => {
    fetchAlertasActivas();
  }, [fetchAlertasActivas]);

  return {
    // Estado
    alertasActivas,
    equiposAtencion,
    loading,
    error,
    totalAlertas,
    
    // Acciones
    fetchAlertasActivas,
    verificarAlertasStock,
    fetchEquiposAtencionInmediata,
    simularConsumo,
    refreshAlertas,
    clearError,
    
    // Utilidades
    getAlertasPorTipo,
    getAlertasCriticas,
    getAlertasMedias,
    getAlertasBajas,
    hayAlertasCriticas
  };
};
