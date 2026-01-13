import { useState, useEffect, useCallback } from 'react';
import { EquipoAPI } from '../services/equipos';
import { 
  mapEquipoToFrontend, 
  mapTipoBarrilToFrontend, 
  mapEstadoEquipoToFrontend 
} from '../utils/mappers';
import {
  Canilla,
  BarrelType,
  EquipmentState,
  EquipmentFilters,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  ChangeBeerRequest,
  EquipoBackend,
  PuntoVentaListItem
} from '../types';

interface UseEquiposReturn {
  // Estado
  equipos: Canilla[];
  tiposBarril: BarrelType[];
  estadosEquipo: EquipmentState[];
  puntosVenta: PuntoVentaListItem[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  pagination: { totalPages: number; page: number; total: number };
  filters: EquipmentFilters;
  
  // Acciones
  fetchEquipos: (page?: number, filters?: EquipmentFilters) => Promise<void>;
  fetchTiposBarril: () => Promise<void>;
  fetchEstadosEquipo: () => Promise<void>;
  fetchPuntosVenta: () => Promise<void>;
  createEquipo: (data: CreateEquipmentRequest) => Promise<EquipoBackend>;
  updateEquipo: (id: number, data: UpdateEquipmentRequest) => Promise<EquipoBackend>;
  deleteEquipo: (equipoId: number) => Promise<void>;
  cambiarCerveza: (equipoId: number, data: ChangeBeerRequest) => Promise<EquipoBackend>;
  toggleEstado: (equipoId: number) => Promise<EquipoBackend>;
  updateTemperatura: (equipoId: number, temperatura: number) => Promise<EquipoBackend>;
  getEquiposBajoStock: (threshold?: number) => Promise<Canilla[]>;
  searchEquipos: (query: string) => Promise<Canilla[]>;
  getEquiposPorUbicacion: (ubicacion: string) => Promise<Canilla[]>;
  
  // Nuevas funciones de alertas
  getAlertasActivas: () => Promise<any>;
  verificarAlertasStock: () => Promise<any>;
  getEquiposAtencionInmediata: () => Promise<any>;
  simularConsumoBarril: (equipoId: number, litros: number) => Promise<any>;
  cambiarEstadoEquipo: (equipoId: number, estadoId: number, motivo?: string) => Promise<EquipoBackend>;
  
  // Utilidades
  refreshEquipos: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: EquipmentFilters) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  calcularPorcentajeNivel: (nivel: number) => number;
  determinarEstadoNivel: (porcentaje: number) => 'alto' | 'medio' | 'bajo' | 'critico';
}

export const useEquipos = (
  initialPage: number = 1,
  pageSize: number = 6,
  initialFilters: EquipmentFilters = {}
): UseEquiposReturn => {
  const [equipos, setEquipos] = useState<Canilla[]>([]);
  const [tiposBarril, setTiposBarril] = useState<BarrelType[]>([]);
  const [estadosEquipo, setEstadosEquipo] = useState<EquipmentState[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVentaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentFilters, setCurrentFilters] = useState<EquipmentFilters>(initialFilters);

  // Obtener equipos con filtros y paginación
  const fetchEquipos = useCallback(async (page: number = currentPage, filters: EquipmentFilters = currentFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar que page no sea NaN, usar 1 como valor por defecto
      const validPage = isNaN(page) ? 1 : page;
      
      const response = await EquipoAPI.getEquipos(validPage, pageSize, filters);
      const equiposMapeados = response.equipos.map(mapEquipoToFrontend);
      
      setEquipos(equiposMapeados);
      setTotalPages(response.total_pages);
      setCurrentPage(validPage);
      setCurrentFilters(filters);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los equipos');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentFilters, pageSize]);

  // Obtener tipos de barril
  const fetchTiposBarril = useCallback(async () => {
    try {
      const response = await EquipoAPI.getTiposBarril();
      
      // El backend devuelve directamente un array de TipoBarrilRead
      if (Array.isArray(response)) {
        const tiposMapeados = response.map(mapTipoBarrilToFrontend);
        setTiposBarril(tiposMapeados);
      } else {
        setTiposBarril([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los tipos de barril');
      setTiposBarril([]);
    }
  }, []);

  // Obtener estados de equipo
  const fetchEstadosEquipo = useCallback(async () => {
    try {
      const response = await EquipoAPI.getEstadosEquipo();
      
      // El backend devuelve directamente un array de TipoEstadoEquipoRead
      if (Array.isArray(response)) {
        const estadosMapeados = response.map(mapEstadoEquipoToFrontend);
        setEstadosEquipo(estadosMapeados);
      } else {
        setEstadosEquipo([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los estados de equipo');
      setEstadosEquipo([]);
    }
  }, []);

  const fetchPuntosVenta = useCallback(async () => {
    try {
      const response = await EquipoAPI.getPuntosVenta();
      setPuntosVenta(Array.isArray(response) ? response : []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar puntos de venta');
      setPuntosVenta([]);
    }
  }, []);

  // Crear nuevo equipo
  const createEquipo = useCallback(async (data: CreateEquipmentRequest): Promise<EquipoBackend> => {
    try {
      setLoading(true);
      setError(null);
      
      const nuevoEquipo = await EquipoAPI.createEquipo(data);
      
      // Refrescar la lista después de crear
      await fetchEquipos();
      
      return nuevoEquipo;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el equipo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEquipos]);

  // Actualizar equipo
  const updateEquipo = useCallback(async (id: number, data: UpdateEquipmentRequest): Promise<EquipoBackend> => {
    try {
      setLoading(true);
      setError(null);
      
      const equipoActualizado = await EquipoAPI.updateEquipo(id, data);
      
      // Actualizar el equipo en el estado local
      setEquipos(prev => prev.map(equipo => 
        equipo.id === id ? mapEquipoToFrontend(equipoActualizado) : equipo
      ));
      
      return equipoActualizado;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar el equipo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEquipo = useCallback(async (equipoId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await EquipoAPI.deleteEquipo(equipoId);
      await fetchEquipos();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar el equipo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEquipos]);

  // Cambiar cerveza en equipo
  const cambiarCerveza = useCallback(async (equipoId: number, data: ChangeBeerRequest): Promise<EquipoBackend> => {
    try {
      setLoading(true);
      setError(null);
      
      const equipoActualizado = await EquipoAPI.cambiarCerveza(equipoId, data);
      
      // Actualizar el equipo en el estado local
      setEquipos(prev => prev.map(equipo => 
        equipo.id === equipoId ? mapEquipoToFrontend(equipoActualizado) : equipo
      ));
      
      return equipoActualizado;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cambiar la cerveza');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Alternar estado del equipo
  const toggleEstado = useCallback(async (equipoId: number): Promise<EquipoBackend> => {
    try {
      setLoading(true);
      setError(null);
      
      const equipoActualizado = await EquipoAPI.toggleEstadoEquipo(equipoId);
      
      // Actualizar el equipo en el estado local
      setEquipos(prev => {
        const nuevosEquipos = prev.map(equipo => 
          equipo.id === equipoId ? mapEquipoToFrontend(equipoActualizado) : equipo
        );
        return nuevosEquipos;
      });
      
      return equipoActualizado;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cambiar el estado del equipo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar temperatura
  const updateTemperatura = useCallback(async (equipoId: number, temperatura: number): Promise<EquipoBackend> => {
    try {
      setLoading(true);
      setError(null);
      
      const equipoActualizado = await EquipoAPI.updateTemperatura(equipoId, temperatura);
      
      // Actualizar el equipo en el estado local
      setEquipos(prev => prev.map(equipo => 
        equipo.id === equipoId ? mapEquipoToFrontend(equipoActualizado) : equipo
      ));
      
      return equipoActualizado;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar la temperatura');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener equipos con stock bajo
  const getEquiposBajoStock = useCallback(async (threshold: number = 20): Promise<Canilla[]> => {
    try {
      const response = await EquipoAPI.getEquiposBajoStock(threshold);
      return response.equipos_bajo_stock.map(mapEquipoToFrontend);
    } catch {
      return [];
    }
  }, []);

  // Buscar equipos
  const searchEquipos = useCallback(async (query: string): Promise<Canilla[]> => {
    try {
      const equiposEncontrados = await EquipoAPI.searchEquipos(query);
      return equiposEncontrados.map(mapEquipoToFrontend);
    } catch {
      return [];
    }
  }, []);

  // Obtener equipos por ubicación
  const getEquiposPorUbicacion = useCallback(async (ubicacion: string): Promise<Canilla[]> => {
    try {
      const equiposPorUbicacion = await EquipoAPI.getEquiposPorUbicacion(ubicacion);
      return equiposPorUbicacion.map(mapEquipoToFrontend);
    } catch {
      return [];
    }
  }, []);

  // Refrescar equipos
  const refreshEquipos = useCallback(async () => {
    await fetchEquipos(currentPage, currentFilters);
  }, [fetchEquipos, currentPage, currentFilters]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Utilidades para cálculos
  const calcularPorcentajeNivel = useCallback((nivel: number): number => {
    return EquipoAPI.calcularPorcentajeNivel(nivel);
  }, []);

  const determinarEstadoNivel = useCallback((porcentaje: number): 'alto' | 'medio' | 'bajo' | 'critico' => {
    return EquipoAPI.determinarEstadoNivel(porcentaje);
  }, []);

  // ===== NUEVAS FUNCIONES DE ALERTAS =====

  // Obtener alertas activas
  const getAlertasActivas = useCallback(async () => {
    try {
      return await EquipoAPI.getAlertasActivas();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al obtener alertas activas');
      return null;
    }
  }, []);

  // Verificar alertas de stock
  const verificarAlertasStock = useCallback(async () => {
    try {
      return await EquipoAPI.verificarAlertasStock();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al verificar alertas');
      return null;
    }
  }, []);

  // Obtener equipos que requieren atención inmediata
  const getEquiposAtencionInmediata = useCallback(async () => {
    try {
      return await EquipoAPI.getEquiposAtencionInmediata();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al obtener equipos que requieren atención');
      return null;
    }
  }, []);

  // Simular consumo de barril
  const simularConsumoBarril = useCallback(async (equipoId: number, litros: number) => {
    try {
      return await EquipoAPI.simularConsumoBarril(equipoId, litros);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al simular consumo');
      return null;
    }
  }, []);

  // Cambiar estado de equipo con motivo
  const cambiarEstadoEquipo = useCallback(async (equipoId: number, estadoId: number, motivo?: string): Promise<EquipoBackend> => {
    try {
      setLoading(true);
      setError(null);
      
      const equipoActualizado = await EquipoAPI.cambiarEstadoEquipo(equipoId, estadoId, motivo);
      
      // Actualizar el equipo en el estado local
      setEquipos(prev => prev.map(equipo => 
        equipo.id === equipoId ? mapEquipoToFrontend(equipoActualizado) : equipo
      ));
      
      return equipoActualizado;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cambiar estado del equipo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función wrapper para setCurrentPage que valida el valor
  const setValidCurrentPage = useCallback((page: number) => {
    const validPage = isNaN(page) ? 1 : page;
    setCurrentPage(validPage);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    fetchEquipos();
    fetchTiposBarril();
    fetchEstadosEquipo();
    fetchPuntosVenta();
  }, []);

  return {
    // Estado
    equipos,
    tiposBarril,
    estadosEquipo,
    puntosVenta,
    loading,
    error,
    totalPages,
    currentPage,
    pagination: { totalPages, page: currentPage, total: equipos.length },
    filters: currentFilters,
    
    // Acciones
    fetchEquipos,
    fetchTiposBarril,
    fetchEstadosEquipo,
    fetchPuntosVenta,
    createEquipo,
    updateEquipo,
    deleteEquipo,
    cambiarCerveza,
    toggleEstado,
    updateTemperatura,
    getEquiposBajoStock,
    searchEquipos,
    getEquiposPorUbicacion,
    
    // Nuevas funciones de alertas
    getAlertasActivas,
    verificarAlertasStock,
    getEquiposAtencionInmediata,
    simularConsumoBarril,
    cambiarEstadoEquipo,
    
    // Utilidades
    refreshEquipos,
    setCurrentPage: setValidCurrentPage,
    setFilters: setCurrentFilters,
    setPage: setValidCurrentPage,
    clearError,
    calcularPorcentajeNivel,
    determinarEstadoNivel
  };
};
