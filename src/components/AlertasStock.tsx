import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Bell, RefreshCw, X } from 'lucide-react';
import { useAlertas } from '../hooks/useAlertas';
import { getAlertColor, formatPercentage } from '../utils/mappers';

interface AlertasStockProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const AlertasStock: React.FC<AlertasStockProps> = ({ 
  className = '', 
  autoRefresh = true, 
  refreshInterval = 30000 // 30 segundos
}) => {
  const {
    alertasActivas,
    loading,
    error,
    totalAlertas,
    fetchAlertasActivas,
    getAlertasCriticas,
    getAlertasMedias,
    getAlertasBajas,
    hayAlertasCriticas,
    clearError
  } = useAlertas();

  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh de alertas
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAlertasActivas();
        setLastRefresh(new Date());
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchAlertasActivas]);

  const handleRefresh = async () => {
    await fetchAlertasActivas();
    setLastRefresh(new Date());
  };

  const getIconComponent = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'critico':
        return <AlertTriangle size={16} />;
      case 'medio':
        return <AlertCircle size={16} />;
      case 'bajo':
        return <Info size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading && alertasActivas.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin mr-2" size={16} />
          <span className="text-sm text-gray-600">Cargando alertas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${hayAlertasCriticas() ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            {hayAlertasCriticas() ? <AlertTriangle size={20} /> : <Bell size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Alertas de Stock
              {totalAlertas > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  hayAlertasCriticas() ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {totalAlertas}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              Última actualización: {formatTime(lastRefresh)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          </button>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 6l4 4 4-4H4z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 pb-2">
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={16} />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="border-t">
          {alertasActivas.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-green-600 mb-2">
                <Bell size={24} className="mx-auto" />
              </div>
              <p className="text-sm text-gray-600">No hay alertas activas</p>
              <p className="text-xs text-gray-500 mt-1">Todos los equipos tienen stock adecuado</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Alertas Críticas */}
              {getAlertasCriticas().length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                    <AlertTriangle size={14} className="mr-1" />
                    Críticas ({getAlertasCriticas().length})
                  </h4>
                  <div className="space-y-2">
                    {getAlertasCriticas().map((alerta, index) => (
                      <div key={index} className={`p-3 rounded-md border ${getAlertColor(alerta.tipo_alerta)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            {getIconComponent(alerta.tipo_alerta)}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{alerta.nombre_equipo}</p>
                              <p className="text-sm">{alerta.cerveza_nombre}</p>
                              <p className="text-xs mt-1">{alerta.mensaje}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">
                              {formatPercentage(alerta.nivel_porcentaje)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas Medias */}
              {getAlertasMedias().length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    Medias ({getAlertasMedias().length})
                  </h4>
                  <div className="space-y-2">
                    {getAlertasMedias().map((alerta, index) => (
                      <div key={index} className={`p-3 rounded-md border ${getAlertColor(alerta.tipo_alerta)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            {getIconComponent(alerta.tipo_alerta)}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{alerta.nombre_equipo}</p>
                              <p className="text-sm">{alerta.cerveza_nombre}</p>
                              <p className="text-xs mt-1">{alerta.mensaje}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">
                              {formatPercentage(alerta.nivel_porcentaje)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas Bajas */}
              {getAlertasBajas().length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                    <Info size={14} className="mr-1" />
                    Informativas ({getAlertasBajas().length})
                  </h4>
                  <div className="space-y-2">
                    {getAlertasBajas().map((alerta, index) => (
                      <div key={index} className={`p-3 rounded-md border ${getAlertColor(alerta.tipo_alerta)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            {getIconComponent(alerta.tipo_alerta)}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{alerta.nombre_equipo}</p>
                              <p className="text-sm">{alerta.cerveza_nombre}</p>
                              <p className="text-xs mt-1">{alerta.mensaje}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">
                              {formatPercentage(alerta.nivel_porcentaje)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
