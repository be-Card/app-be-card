import { useState, useEffect, useCallback } from 'react';
import { CervezaAPI } from '../services/cervezas';
import { mapCervezaToFrontend, mapEstiloCervezaToFrontend } from '../utils/mappers';
import {
  Beer,
  BeerStyle,
  BeerFilters,
  CreateBeerRequest,
  UpdateBeerRequest,
  CreateBeerPriceRequest,
  CervezaBackend
} from '../types';

interface UseCervezasReturn {
  // Estado
  cervezas: Beer[];
  estilos: BeerStyle[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  
  // Acciones
  fetchCervezas: (page?: number, filters?: BeerFilters) => Promise<void>;
  fetchEstilos: () => Promise<void>;
  createEstilo: (data: { estilo: string; descripcion?: string; origen?: string }) => Promise<void>;
  deleteEstilo: (estiloId: number) => Promise<void>;
  createCerveza: (data: CreateBeerRequest) => Promise<CervezaBackend>;
  updateCerveza: (id: number, data: UpdateBeerRequest) => Promise<CervezaBackend>;
  deleteCerveza: (id: number) => Promise<void>;
  createPrecio: (data: CreateBeerPriceRequest) => Promise<void>;
  searchCervezas: (query: string) => Promise<Beer[]>;
  getCervezasActivas: () => Promise<Beer[]>;
  
  // Utilidades
  refreshCervezas: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  clearError: () => void;
}

export const useCervezas = (
  initialPage: number = 1,
  pageSize: number = 6,
  initialFilters: BeerFilters = {}
): UseCervezasReturn => {
  const [cervezas, setCervezas] = useState<Beer[]>([]);
  const [estilos, setEstilos] = useState<BeerStyle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentFilters, setCurrentFilters] = useState<BeerFilters>(initialFilters);

  // Obtener cervezas con filtros y paginación
  const fetchCervezas = useCallback(async (page: number = currentPage, filters: BeerFilters = currentFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await CervezaAPI.getCervezas(page, pageSize, filters);
      const cervezasMapeadas = response.cervezas.map(mapCervezaToFrontend);
      
      setCervezas(cervezasMapeadas);
      setTotalPages(response.total_pages);
      setCurrentPage(page);
      setCurrentFilters(filters);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar las cervezas');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentFilters, pageSize]);

  // Obtener estilos de cerveza
  const fetchEstilos = useCallback(async () => {
    try {
      const response = await CervezaAPI.getEstilosCerveza();
      // Validación de seguridad para evitar errores de undefined
      // La respuesta es directamente un array, no un objeto con propiedad estilos
      if (response && Array.isArray(response)) {
        const estilosMapeados = response.map(mapEstiloCervezaToFrontend);
        setEstilos(estilosMapeados);
      } else {
        setEstilos([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los estilos');
      setEstilos([]); // Establecer array vacío en caso de error
    }
  }, []);

  // Crear nueva cerveza
  const createCerveza = useCallback(async (data: CreateBeerRequest): Promise<CervezaBackend> => {
    try {
      setLoading(true);
      setError(null);
      
      const nuevaCerveza = await CervezaAPI.createCerveza(data);
      
      // Refrescar la lista después de crear
      await fetchCervezas();
      
      return nuevaCerveza;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la cerveza');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCervezas]);

  const createEstilo = useCallback(
    async (data: { estilo: string; descripcion?: string; origen?: string }) => {
      try {
        setLoading(true);
        setError(null);
        await CervezaAPI.createEstiloCerveza({
          estilo: data.estilo,
          descripcion: data.descripcion ?? null,
          origen: data.origen ?? null,
        });
        await fetchEstilos();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al crear el estilo');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEstilos]
  );

  const deleteEstilo = useCallback(
    async (estiloId: number) => {
      try {
        setLoading(true);
        setError(null);
        await CervezaAPI.deleteEstiloCerveza(estiloId);
        await fetchEstilos();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al eliminar el estilo');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEstilos]
  );

  // Actualizar cerveza
  const updateCerveza = useCallback(async (id: number, data: UpdateBeerRequest): Promise<CervezaBackend> => {
    try {
      setLoading(true);
      setError(null);
      
      const cervezaActualizada = await CervezaAPI.updateCerveza(id, data);
      
      // Actualizar la cerveza en el estado local
      setCervezas(prev => prev.map(cerveza => 
        cerveza.id === id ? mapCervezaToFrontend(cervezaActualizada) : cerveza
      ));
      
      return cervezaActualizada;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar la cerveza');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar cerveza
  const deleteCerveza = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await CervezaAPI.deleteCerveza(id);
      
      // Remover la cerveza del estado local
      setCervezas(prev => prev.filter(cerveza => cerveza.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar la cerveza');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear precio para cerveza
  const createPrecio = useCallback(async (data: CreateBeerPriceRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await CervezaAPI.createPrecioCerveza(data);
      
      // Refrescar la lista para obtener el precio actualizado
      await fetchCervezas();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el precio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCervezas]);

  // Buscar cervezas
  const searchCervezas = useCallback(async (query: string): Promise<Beer[]> => {
    try {
      const cervezasEncontradas = await CervezaAPI.searchCervezas(query);
      return cervezasEncontradas.map(mapCervezaToFrontend);
    } catch {
      return [];
    }
  }, []);

  // Obtener cervezas activas
  const getCervezasActivas = useCallback(async (): Promise<Beer[]> => {
    try {
      const cervezasActivas = await CervezaAPI.getCervezasActivas();
      return cervezasActivas.map(mapCervezaToFrontend);
    } catch {
      return [];
    }
  }, []);

  // Refrescar cervezas
  const refreshCervezas = useCallback(async () => {
    await fetchCervezas(currentPage, currentFilters);
  }, [fetchCervezas, currentPage, currentFilters]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar solo estilos inicialmente - las cervezas se cargan desde el componente
  useEffect(() => {
    fetchEstilos();
  }, []);

  return {
    // Estado
    cervezas,
    estilos,
    loading,
    error,
    totalPages,
    currentPage,
    
    // Acciones
    fetchCervezas,
    fetchEstilos,
    createEstilo,
    deleteEstilo,
    createCerveza,
    updateCerveza,
    deleteCerveza,
    createPrecio,
    searchCervezas,
    getCervezasActivas,
    
    // Utilidades
    refreshCervezas,
    setCurrentPage,
    clearError
  };
};
