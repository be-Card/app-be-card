import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { Search, Filter, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, ChevronDown, Power } from 'lucide-react';
import CreatePromotionModal, { PromotionFormData } from '../components/CreatePromotionModal';
import EditPromotionModal from '../components/EditPromotionModal';
import ViewPromotionModal from '../components/ViewPromotionModal';
import PricingAPI from '../services/pricing';
import { CervezaAPI } from '../services/cervezas';
import { ReglaDePrecioBackend } from '../types';

interface Promotion {
  id: number;
  name: string;
  discount: number;
  scope: string;
  days: string[];
  startTime: string;
  endTime: string;
  status: 'Activa' | 'Programada' | 'Inactiva';
}

const PricingAndPromotions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [nameOrder, setNameOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'' | 'Activa' | 'Programada' | 'Inactiva'>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [showNameOrderDropdown, setShowNameOrderDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const nameOrderRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);

  const getPaginationItems = (current: number, total: number): Array<number | 'ellipsis'> => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
    if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  };

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [viewPromotion, setViewPromotion] = useState<ReglaDePrecioBackend | null>(null);

  // Data state from API
  const [promotions, setPromotions] = useState<ReglaDePrecioBackend[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format days for display
  const formatDaysForDisplay = (days: string[]): string => {
    const dayMap: Record<string, string> = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    
    return days.map(day => dayMap[day] || day).join(', ');
  };

  // Helper function to format schedule for display
  const formatSchedule = (startTime: string, endTime: string): string => {
    if (!startTime && !endTime) return 'Todo el día';
    if (!startTime) return `Hasta ${endTime}`;
    if (!endTime) return `Desde ${startTime}`;
    return `${startTime} - ${endTime}`;
  };

  // Map backend rule to UI promotion
  const reglaToPromotion = (regla: ReglaDePrecioBackend): Promotion => {
    const dias = (() => {
      try {
        if (!regla.dias_semana) return [];
        const parsed = JSON.parse(regla.dias_semana);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    const startIso = regla.fecha_hora_inicio;
    const endIso = regla.fecha_hora_fin ?? '';
    const toHHMM = (iso: string) => {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      } catch {
        return '';
      }
    };

    const multiplicador = Number(regla.multiplicador);
    const discount = Math.max(0, Math.round((1 - multiplicador) * 100));

    return {
      id: regla.id,
      name: regla.nombre,
      discount,
      scope: regla.alcance,
      days: dias,
      startTime: toHHMM(startIso),
      endTime: toHHMM(endIso),
      status: regla.estado,
    };
  };

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PricingAPI.getReglas({
        page: currentPage,
        per_page: itemsPerPage,
        search: searchTerm || undefined,
        estado: statusFilter || undefined,
        order_dir: nameOrder,
      });
      setPromotions(data.reglas);
      setTotalRecords(data.total);
    } catch (e) {
      const status = (e as AxiosError)?.response?.status;
      if (status === 403) setError('No tienes permisos para ver estas promociones.');
      else setError('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, nameOrder]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (nameOrderRef.current && target && !nameOrderRef.current.contains(target)) setShowNameOrderDropdown(false);
      if (statusRef.current && target && !statusRef.current.contains(target)) setShowStatusDropdown(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  // Modal handlers
  const handleCreatePromotion = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsEditModalOpen(true);
  };

  const handleViewPromotion = async (promotionId: number) => {
    try {
      setError(null);
      const regla = await PricingAPI.getRegla(promotionId);
      setViewPromotion(regla);
      setIsViewModalOpen(true);
    } catch {
      setError('Error al obtener el detalle de la promoción');
    }
  };

  const getTimeRangeIso = (startTime: string, endTime: string) => {
    const today = new Date();
    const withTime = (time: string, addDays: number = 0) => {
      if (!time) return null;
      const [hh, mm] = time.split(':');
      const d = new Date(today);
      d.setDate(d.getDate() + addDays);
      d.setHours(Number(hh), Number(mm), 0, 0);
      return d.toISOString();
    };
    const startIso = withTime(startTime) || new Date().toISOString();
    if (!endTime) return { startIso, endIso: null as string | null };
    const startParts = startTime ? startTime.split(':').map(Number) : null;
    const endParts = endTime.split(':').map(Number);
    const crossesMidnight =
      !!startParts && (endParts[0] < startParts[0] || (endParts[0] === startParts[0] && endParts[1] <= startParts[1]));
    const endIso = withTime(endTime, crossesMidnight ? 1 : 0);
    return { startIso, endIso };
  };

  const resolveCervezasIdsForScope = async (scope: string): Promise<number[] | null> => {
    if (!scope || scope === 'Todas las cervezas') return null;
    const all: any[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const data = await CervezaAPI.getCervezas(page, 200);
      all.push(...(data.cervezas || []));
      totalPages = data.total_pages || 1;
      page += 1;
    } while (page <= totalPages);
    const cervezasFiltradas = all.filter((c: any) => c.tipo && String(c.tipo).toLowerCase() === scope.toLowerCase());
    if (!cervezasFiltradas.length) return null;
    return cervezasFiltradas.map((c: any) => c.id);
  };

  const handleCreateSubmit = async (formData: PromotionFormData) => {
    const discountPct = parseInt(formData.discount) || 0;
    const multiplicador = Math.max(0, Math.min(1, 1 - discountPct / 100));
    const { startIso, endIso } = getTimeRangeIso(formData.startTime, formData.endTime);

    try {
      // Preparar alcance basado en la selección
      const cervezas_ids = await resolveCervezasIdsForScope(formData.scope);

      await PricingAPI.createRegla({
        nombre: formData.name,
        descripcion: null,
        precio: null,
        esta_activo: true,
        prioridad: 'media',
        multiplicador,
        fecha_hora_inicio: startIso,
        fecha_hora_fin: endIso,
        dias_semana: formData.days.length ? JSON.stringify(formData.days) : null,
        cervezas_ids,
        puntos_venta_ids: null,
        equipos_ids: null,
      });
      setIsCreateModalOpen(false);
      await fetchPromotions();
    } catch (e) {
      const status = (e as AxiosError)?.response?.status;
      if (status === 403) setError('Necesitas permisos de administrador para crear reglas.');
      else if (status === 400) setError('Datos inválidos al crear la regla. Verifica los campos.');
      else setError('Error al crear la regla');
    }
  };

  const handleEditSubmit = async (formData: PromotionFormData) => {
    if (!selectedPromotion) return;
    const discountPct = parseInt(formData.discount) || 0;
    const multiplicador = Math.max(0, Math.min(1, 1 - discountPct / 100));
    const { startIso, endIso } = getTimeRangeIso(formData.startTime, formData.endTime);

    try {
      const cervezas_ids = await resolveCervezasIdsForScope(formData.scope);
      await PricingAPI.updateRegla(selectedPromotion.id, {
        nombre: formData.name,
        multiplicador,
        fecha_hora_inicio: startIso,
        fecha_hora_fin: endIso,
        dias_semana: formData.days.length ? JSON.stringify(formData.days) : null,
        cervezas_ids,
      });
      setIsEditModalOpen(false);
      setSelectedPromotion(null);
      await fetchPromotions();
    } catch (e) {
      const status = (e as AxiosError)?.response?.status;
      if (status === 403) setError('Necesitas permisos de administrador para actualizar reglas.');
      else if (status === 400) setError('Datos inválidos al actualizar la regla.');
      else setError('Error al actualizar la regla');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await PricingAPI.deleteRegla(id);
      await fetchPromotions();
    } catch (e) {
      const status = (e as AxiosError)?.response?.status;
      if (status === 403) setError('Necesitas permisos de administrador para eliminar reglas.');
      else setError('Error al eliminar la regla');
    }
  };

  const handleSetActive = async (id: number, active: boolean) => {
    try {
      setError(null);
      await PricingAPI.updateRegla(id, { esta_activo: active });
      await fetchPromotions();
    } catch {
      setError(active ? 'Error al activar la promoción' : 'Error al desactivar la promoción');
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  const paginatedPromotions = promotions.map(reglaToPromotion);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Activa':
        return (
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border border-[#299d58] bg-[#299d581a] text-[#299d58]">
            {status}
          </span>
        );
      case 'Programada':
        return (
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border border-[#0da2e7] bg-[#0da2e71a] text-[#0da2e7]">
            {status}
          </span>
        );
      case 'Inactiva':
        return (
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border border-red-500 bg-red-500/10 text-red-500">
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border border-gray-500 bg-gray-500/10 text-gray-500">
            {status}
          </span>
        );
    }
  };

  const getDiscountBadge = (discount: number) => {
    return (
      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium border border-[#f5970a] bg-[#f5970a1a] text-[#f5970a]">
        -{discount}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Content */}
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white font-inter mb-6">Precios y Promociones</h1>
        {/* Top Controls */}
        <div className="flex items-center gap-5 mb-6">
          {/* Search */}
          <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-lg px-5 py-3 w-[483px]">
            <Search className="w-[18px] h-[18px] text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setCurrentPage(1);
                setSearchTerm(e.target.value);
              }}
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none font-inter text-sm font-light"
            />
          </div>

          {/* Name Filter */}
          <div ref={nameOrderRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => {
                setShowStatusDropdown(false);
                setShowNameOrderDropdown((v) => !v);
              }}
              className="w-full flex items-center gap-3 bg-[#1f1f1f] rounded-lg px-5 py-3"
            >
              <Filter className="w-[18px] h-[18px] text-gray-400" />
              <span className="flex-1 text-left text-white font-inter text-sm font-light">
                {nameOrder === 'asc' ? 'Nombres (A-Z)' : 'Nombres (Z-A)'}
              </span>
              <ChevronDown className={`w-[18px] h-[18px] text-gray-400 transition-transform ${showNameOrderDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showNameOrderDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-[#333333] rounded-[10px] z-10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    setNameOrder('asc');
                    setShowNameOrderDropdown(false);
                  }}
                  className="w-full px-5 py-3 text-left text-sm font-light text-white font-inter hover:bg-[#333333]"
                >
                  Nombres (A-Z)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    setNameOrder('desc');
                    setShowNameOrderDropdown(false);
                  }}
                  className="w-full px-5 py-3 text-left text-sm font-light text-white font-inter hover:bg-[#333333]"
                >
                  Nombres (Z-A)
                </button>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div ref={statusRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => {
                setShowNameOrderDropdown(false);
                setShowStatusDropdown((v) => !v);
              }}
              className="w-full flex items-center gap-3 bg-[#1f1f1f] rounded-lg px-5 py-3"
            >
              <Filter className="w-[18px] h-[18px] text-gray-400" />
              <span className="flex-1 text-left text-white font-inter text-sm font-light">
                {statusFilter || 'Estados'}
              </span>
              <ChevronDown className={`w-[18px] h-[18px] text-gray-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-[#333333] rounded-[10px] z-10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    setStatusFilter('');
                    setShowStatusDropdown(false);
                  }}
                  className="w-full px-5 py-3 text-left text-sm font-light text-white font-inter hover:bg-[#333333]"
                >
                  Estados
                </button>
                {(['Activa', 'Programada', 'Inactiva'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      setStatusFilter(s);
                      setShowStatusDropdown(false);
                    }}
                    className="w-full px-5 py-3 text-left text-sm font-light text-white font-inter hover:bg-[#333333]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create Button */}
          <button 
            onClick={handleCreatePromotion}
            className="flex items-center gap-3 bg-gradient-to-l from-[#f06f26] to-[#f1c112] rounded-lg px-5 py-3 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            <span className="font-inter text-sm font-semibold">Crear Nueva Regla</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#1f1f1f] border border-[#333333] rounded-lg pt-6 pb-6">
          {/* Table Header */}
          <div className="grid grid-cols-[180px_120px_180px_240px_140px_120px_120px] items-center px-6 py-4">
            <div className="text-sm font-semibold text-white/70 font-inter">Nombre</div>
            <div className="text-sm font-semibold text-white/70 font-inter">Descuento</div>
            <div className="text-sm font-semibold text-white/70 font-inter">Alcance</div>
            <div className="text-sm font-semibold text-white/70 font-inter">Días</div>
            <div className="text-sm font-semibold text-white/70 font-inter">Horario</div>
            <div className="text-sm font-semibold text-white/70 font-inter">Estado</div>
            <div className="text-sm font-semibold text-white/70 font-inter text-right pr-2">Acciones</div>
          </div>

          <div className="h-px bg-[#333333] mx-0" />

          {/* Table Rows */}
          {loading && (
            <div className="px-6 py-5 text-sm text-white/70">Cargando promociones...</div>
          )}
          {error && (
            <div className="px-6 py-5 text-sm text-red-400">{error}</div>
          )}
          {!loading && !error && paginatedPromotions.length === 0 && (
            <div className="px-6 py-5 text-sm text-white/70">No se encontraron promociones.</div>
          )}
          {!loading && !error && paginatedPromotions.map((promotion, index) => (
            <React.Fragment key={promotion.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleViewPromotion(promotion.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleViewPromotion(promotion.id);
                }}
                className="grid grid-cols-[180px_120px_180px_240px_140px_120px_120px] items-center px-6 py-5 cursor-pointer hover:bg-[#171717] transition-colors"
              >
                <div className="text-sm font-semibold text-white font-inter pr-3 break-words">{promotion.name}</div>
                <div className="flex items-center">{getDiscountBadge(promotion.discount)}</div>
                <div className="text-sm font-semibold text-white font-inter pr-3 break-words">{promotion.scope}</div>
                <div className="text-sm font-semibold text-white font-inter pr-3 whitespace-normal leading-tight">
                  {formatDaysForDisplay(promotion.days)}
                </div>
                <div className="text-sm font-semibold text-white font-inter">{formatSchedule(promotion.startTime, promotion.endTime)}</div>
                <div className="flex items-center">{getStatusBadge(promotion.status)}</div>
                <div className="flex items-center justify-end gap-4 pr-2">
                  <button
                    className="p-1 hover:opacity-70 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewPromotion(promotion.id);
                    }}
                  >
                    <Eye className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    className="p-1 hover:opacity-70 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetActive(promotion.id, promotion.status !== 'Activa' && promotion.status !== 'Programada');
                    }}
                    title={promotion.status === 'Inactiva' ? 'Activar' : 'Desactivar'}
                  >
                    <Power className="w-5 h-5 text-gray-400" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPromotion(promotion);
                    }}
                    className="p-1 hover:opacity-70 transition-opacity"
                  >
                    <Edit className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    className="p-1 hover:opacity-70 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(promotion.id);
                    }}
                  >
                    <Trash2 className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              {index < paginatedPromotions.length - 1 && (
                <div className="h-px bg-[#333333] mx-0" />
              )}
            </React.Fragment>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#333333] mt-2">
            <span className="text-xs font-medium text-white font-inter">
              Mostrando {Math.min(itemsPerPage, promotions.length)} de {totalRecords} promociones
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-[#333333] rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              
              {getPaginationItems(currentPage, totalPages).map((item, idx) => {
                if (item === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-white/70 font-inter">
                      …
                    </span>
                  );
                }

                return (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                      currentPage === item
                        ? 'bg-[#171717] text-white'
                        : 'border border-[#333333] text-white hover:bg-gray-700'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-[#333333] rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <CreatePromotionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />

        <EditPromotionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPromotion(null);
          }}
          onSubmit={handleEditSubmit}
          promotion={selectedPromotion}
        />

        <ViewPromotionModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewPromotion(null);
          }}
          promotion={viewPromotion}
          onEdit={(regla) => {
            setIsViewModalOpen(false);
            setViewPromotion(null);
            setSelectedPromotion(reglaToPromotion(regla));
            setIsEditModalOpen(true);
          }}
          onSetActive={async (promotionId, active) => {
            await handleSetActive(promotionId, active);
            setIsViewModalOpen(false);
            setViewPromotion(null);
          }}
        />
      </div>
    </div>
  );
};

export default PricingAndPromotions;
