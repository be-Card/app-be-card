import React, { useEffect, useState } from 'react';
import { BarChart3, Droplets, Thermometer, RefreshCw, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEquipos } from '../hooks/useEquipos';
import { useAlertas } from '../hooks/useAlertas';
import { 
  formatPercentage, 
  formatVolume, 
  formatTemperature, 
} from '../utils/mappers';

interface StockEnTiempoRealProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showOnlyLowStock?: boolean;
}

export const StockEnTiempoReal: React.FC<StockEnTiempoRealProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 15000, // 15 segundos
  showOnlyLowStock = false
}) => {
  const {
    equipos,
    loading: equiposLoading,
    error: equiposError,
    refreshEquipos,
    determinarEstadoNivel: determinarEstado
  } = useEquipos();

  const {
    simularConsumo,
    loading: alertasLoading
  } = useAlertas();

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [simulatingEquipo, setSimulatingEquipo] = useState<number | null>(null);

  // Auto-refresh de datos
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshEquipos();
        setLastRefresh(new Date());
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshEquipos]);

  const handleRefresh = async () => {
    await refreshEquipos();
    setLastRefresh(new Date());
  };

  const handleSimularConsumo = async (equipoId: number, litros: number) => {
    setSimulatingEquipo(equipoId);
    try {
      const resultado = await simularConsumo(equipoId, litros);
      if (resultado) {
        // Refrescar datos después de la simulación
        await refreshEquipos();
      }
    } catch {
    } finally {
      setSimulatingEquipo(null);
    }
  };

  const getEquiposToShow = () => {
    if (showOnlyLowStock) {
      return equipos.filter(equipo => {
        const porcentaje = equipo.barrelLevel || 0;
        const estado = determinarEstado(porcentaje);
        return estado === 'bajo' || estado === 'critico';
      });
    }
    return equipos;
  };

  const getBarrelLevelColor = (porcentaje: number) => {
    const estado = determinarEstado(porcentaje);
    switch (estado) {
      case 'critico':
        return 'bg-red-500';
      case 'bajo':
        return 'bg-yellow-500';
      case 'medio':
        return 'bg-blue-500';
      case 'alto':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (porcentaje: number) => {
    const estado = determinarEstado(porcentaje);
    switch (estado) {
      case 'critico':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'bajo':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'medio':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'alto':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const equiposToShow = getEquiposToShow();

  if (equiposLoading && equipos.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin mr-2" size={16} />
          <span className="text-sm text-gray-600">Cargando datos de stock...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Stock en Tiempo Real
              {showOnlyLowStock && (
                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Stock Bajo
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              Última actualización: {formatTime(lastRefresh)}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          disabled={equiposLoading}
        >
          <RefreshCw className={equiposLoading ? 'animate-spin' : ''} size={16} />
        </button>
      </div>

      {/* Error Message */}
      {equiposError && (
        <div className="p-4 border-b">
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={16} />
            <span className="text-sm text-red-700">{equiposError}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {equiposToShow.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <BarChart3 size={32} className="mx-auto" />
            </div>
            <p className="text-sm text-gray-600">
              {showOnlyLowStock ? 'No hay equipos con stock bajo' : 'No hay equipos disponibles'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {equiposToShow.map((equipo) => {
              const porcentaje = equipo.barrelLevel || 0;
              const estado = determinarEstado(porcentaje);
              const volumenActual = equipo.currentVolume || 0;
              const capacidadTotal = equipo.barrelCapacity || 0;
              
              return (
                <div key={equipo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Header del equipo */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{equipo.name}</h4>
                      <p className="text-sm text-gray-500">{equipo.location}</p>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(porcentaje)}`}>
                      {estado.toUpperCase()}
                    </div>
                  </div>

                  {/* Información de la cerveza */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">{equipo.currentBeer}</p>
                    <p className="text-xs text-gray-500">{equipo.beerType}</p>
                  </div>

                  {/* Barra de progreso del barril */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Nivel del Barril</span>
                      <span className="text-sm font-medium">{formatPercentage(porcentaje)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getBarrelLevelColor(porcentaje)}`}
                        style={{ width: `${Math.max(porcentaje, 2)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatVolume(volumenActual)} / {formatVolume(capacidadTotal)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTemperature(equipo.temperature || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Métricas adicionales */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Droplets size={14} className="text-blue-500" />
                      </div>
                      <p className="text-xs text-gray-500">Volumen</p>
                      <p className="text-sm font-medium">{formatVolume(volumenActual)}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Thermometer size={14} className="text-orange-500" />
                      </div>
                      <p className="text-xs text-gray-500">Temperatura</p>
                      <p className="text-sm font-medium">{formatTemperature(equipo.temperature || 0)}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        {estado === 'critico' || estado === 'bajo' ? (
                          <TrendingDown size={14} className="text-red-500" />
                        ) : (
                          <TrendingUp size={14} className="text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Estado</p>
                      <p className="text-sm font-medium capitalize">{estado}</p>
                    </div>
                  </div>

                  {/* Acciones de simulación */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-gray-500">Simular consumo:</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSimularConsumo(equipo.id, 1)}
                        disabled={simulatingEquipo === equipo.id || alertasLoading}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                      >
                        1L
                      </button>
                      <button
                        onClick={() => handleSimularConsumo(equipo.id, 2)}
                        disabled={simulatingEquipo === equipo.id || alertasLoading}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                      >
                        2L
                      </button>
                      <button
                        onClick={() => handleSimularConsumo(equipo.id, 5)}
                        disabled={simulatingEquipo === equipo.id || alertasLoading}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                      >
                        5L
                      </button>
                    </div>
                  </div>

                  {/* Indicador de simulación */}
                  {simulatingEquipo === equipo.id && (
                    <div className="mt-2 flex items-center justify-center text-xs text-blue-600">
                      <RefreshCw className="animate-spin mr-1" size={12} />
                      Simulando consumo...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
