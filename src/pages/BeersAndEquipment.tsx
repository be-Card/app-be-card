import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Grid, List, Plus, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, PowerOff, Power, X, Upload } from 'lucide-react';
import styles from './BeersAndEquipment.module.scss';
import { useCervezas } from '../hooks/useCervezas';
import { useEquipos } from '../hooks/useEquipos';
import { 
  Beer, 
  Canilla, 
  BeerFormData, 
  CreateBeerRequest, 
  UpdateBeerRequest,
  ChangeBeerRequest,
} from '../types';
import { 
  determinarEstadoNivel,
  formatearPrecio
} from '../utils/mappers';

const BeersAndEquipment: React.FC = () => {
  // Hooks para datos del backend
  const {
    cervezas: beers,
    totalPages: beersTotalPages,
    currentPage: beersCurrentPage,
    fetchCervezas: fetchBeers,
    createCerveza: createBeer,
    updateCerveza: updateBeer,
    deleteCerveza: deleteBeer,
    estilos: beerStyles,
    createEstilo,
    deleteEstilo,
    getCervezasActivas
  } = useCervezas();

  const {
    equipos: equipment,
    totalPages: equipmentTotalPages,
    currentPage: equipmentCurrentPage,
    fetchEquipos: fetchEquipment,
    createEquipo: createEquipment,
    deleteEquipo: deleteEquipment,
    cambiarCerveza: changeBeerInEquipment,
    toggleEstado: toggleEquipmentStatus,
    setFilters: setEquipmentFilters,
    tiposBarril: barrelTypes,
    estadosEquipo: equipmentStates,
    puntosVenta,
  } = useEquipos();

  // Estados principales
  const [activeTab, setActiveTab] = useState<'cervezas' | 'canillas'>('cervezas');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCanillaStatus, setSelectedCanillaStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [nameSort, setNameSort] = useState<'asc' | 'desc'>('asc');
  const [isNameSortOpen, setIsNameSortOpen] = useState(false);
  const [isBeerStatusOpen, setIsBeerStatusOpen] = useState(false);
  const [isCanillaStatusOpen, setIsCanillaStatusOpen] = useState(false);

  // Estado para cervezas activas (para dropdown de cambio de cerveza)
  const [activeBeersList, setActiveBeersList] = useState<Beer[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBeer, setEditingBeer] = useState<Beer | null>(null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [styleForm, setStyleForm] = useState({ estilo: '', descripcion: '', origen: '' });
  const [styleFormError, setStyleFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BeerFormData>({
    name: '',
    brewery: '',
    style: '',
    country: '',
    abv: '',
    ibu: '',
    pricePerLiter: '',
    stock: '0',
    photo: null
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState<{
    nombre_equipo: string;
    id_barril: string;
    id_estado_equipo: string;
    id_estilo: string;
    id_cerveza: string;
    id_punto_de_venta: string;
    temperatura_actual: string;
    capacidad_actual: string;
    ultima_limpieza: string;
    proxima_limpieza: string;
  }>({
    nombre_equipo: '',
    id_barril: '',
    id_estado_equipo: '',
    id_estilo: '',
    id_cerveza: '',
    id_punto_de_venta: '',
    temperatura_actual: '',
    capacidad_actual: '',
    ultima_limpieza: '',
    proxima_limpieza: '',
  });
  const [equipmentFormError, setEquipmentFormError] = useState<string>('');

  // Change Tap Modal state
  const [isChangeTapModalOpen, setIsChangeTapModalOpen] = useState(false);
  const [selectedTap, setSelectedTap] = useState<Canilla | null>(null);
  const [selectedNewBeer, setSelectedNewBeer] = useState('');
  const [selectedBarrelTypeId, setSelectedBarrelTypeId] = useState<number | null>(null);
  const [selectedCapacity, setSelectedCapacity] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [capacityError, setCapacityError] = useState<string>('');

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (isInitialLoad) {
        await Promise.all([
          fetchBeers(),
          fetchEquipment(),
          loadActiveBeers()
        ]);
        setIsInitialLoad(false);
      }
    };

    loadInitialData();
  }, [isInitialLoad, fetchBeers, fetchEquipment]);

  // Función para cargar cervezas activas
  const loadActiveBeers = async () => {
    try {
      const activeBeers = await getCervezasActivas();
      setActiveBeersList(activeBeers);
    } catch {
      setActiveBeersList([]);
    }
  };

  // Efectos para cargar datos iniciales (legacy)
  useEffect(() => {
    setIsNameSortOpen(false);
    setIsBeerStatusOpen(false);
    setIsCanillaStatusOpen(false);
    if (activeTab === 'cervezas') {
      fetchBeers();
    } else {
      fetchEquipment(1);
    }
    // Marcar que ya no es la carga inicial después de la primera ejecución
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [activeTab]);

  // Efecto para aplicar filtros (solo después de la carga inicial)
  useEffect(() => {
    // No ejecutar durante la carga inicial para evitar llamadas duplicadas
    if (isInitialLoad) {
      return;
    }
    
    const delayedSearch = setTimeout(() => {
      if (activeTab === 'cervezas') {
        const activo =
          statusFilter === 'Activa' ? true : statusFilter === 'Inactiva' ? false : undefined;

        const filters = {
          search: searchTerm || undefined,
          activo,
          order_dir: nameSort,
        };

        fetchBeers(1, filters);
      } else {
        const permite_ventas =
          selectedCanillaStatus === 'En Línea'
            ? true
            : selectedCanillaStatus === 'Fuera de Línea'
              ? false
              : undefined;

        const filters = {
          nombre: searchTerm || undefined,
          permite_ventas,
          order_dir: nameSort,
        };

        setEquipmentFilters(filters);
        fetchEquipment(1, filters);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter, selectedCanillaStatus, activeTab, isInitialLoad, nameSort]);

  // Datos actuales basados en el tab activo
  const currentData = activeTab === 'cervezas' ? beers : equipment;

  // Datos paginados del backend
  const paginatedData = currentData;

  const getPaginationItems = (current: number, total: number): Array<number | 'ellipsis'> => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', total];
    }

    if (current >= total - 3) {
      return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  };

  const handleEdit = (id: number) => {
    if (activeTab === 'cervezas') {
      const beer = beers.find(b => b.id === id);
      if (beer) {
        setEditingBeer(beer);
        // Buscar el ID del estilo desde la lista de estilos
        const styleId = beerStyles?.find((s) => s.name === beer.style)?.id || '';

        setFormData({
          name: beer.name || '',
          brewery: beer.brewery || '',
          style: styleId.toString() || '',
          country: (beer as any).country || 'Argentina',
          abv: beer.abv?.toString() || '',
          ibu: beer.ibu?.toString() || '',
          pricePerLiter: beer.pricePerLiter?.toString() || '0',
          stock: (beer.stockBase ?? 0).toString(),
          photo: null
        });
        setFormErrors({});
        setIsModalOpen(true);
      }
    }
  };

  const handleActivateBeer = async (id: number) => {
    try {
      await updateBeer(id, { activo: true });
      await fetchBeers();
    } catch {
      alert('Error al activar la cerveza');
    }
  };

  const handleDeleteBeer = async (id: number) => {
    try {
      await deleteBeer(id);
      await fetchBeers();
    } catch {
      alert('Error al eliminar la cerveza');
    }
  };

  // Modal functions
  const openModal = () => {
    setEditingBeer(null);
    setIsModalOpen(true);
    setFormData({
      name: '',
      brewery: '',
      style: '',
      country: '',
      abv: '',
      ibu: '',
      pricePerLiter: '',
      stock: '0',
      photo: null
    });
    setFormErrors({});
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBeer(null);
    setFormData({
      name: '',
      brewery: '',
      style: '',
      country: '',
      abv: '',
      ibu: '',
      pricePerLiter: '',
      stock: '0',
      photo: null
    });
    setFormErrors({});
    setIsDragOver(false);
  };

  const openStyleModal = () => {
    setStyleForm({ estilo: '', descripcion: '', origen: '' });
    setStyleFormError(null);
    setIsStyleModalOpen(true);
  };

  const closeStyleModal = () => {
    setIsStyleModalOpen(false);
    setStyleFormError(null);
  };

  const handleCreateStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    setStyleFormError(null);
    try {
      await createEstilo({
        estilo: styleForm.estilo,
        descripcion: styleForm.descripcion || undefined,
        origen: styleForm.origen || undefined,
      });
      setStyleForm({ estilo: '', descripcion: '', origen: '' });
    } catch (err: any) {
      setStyleFormError(err?.response?.data?.detail || 'No se pudo crear el estilo');
    }
  };

  const handleDeleteStyle = async (styleId: number) => {
    const ok = window.confirm('¿Eliminar estilo?');
    if (!ok) return;
    setStyleFormError(null);
    try {
      await deleteEstilo(styleId);
    } catch (err: any) {
      setStyleFormError(err?.response?.data?.detail || 'No se pudo eliminar el estilo');
    }
  };

  const handleInputChange = (field: keyof BeerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      if (formErrors.photo) {
        setFormErrors(prev => ({
          ...prev,
          photo: ''
        }));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.name?.trim()) errors.name = 'El nombre es obligatorio';
    if (!formData.brewery?.trim()) errors.brewery = 'La cervecería es obligatoria';
    if (!formData.style?.trim()) errors.style = 'El estilo es obligatorio';
    if (!formData.country?.trim()) errors.country = 'El país es obligatorio';
    if (!formData.abv?.trim()) errors.abv = 'El ABV es obligatorio';
    if (!formData.ibu?.trim()) errors.ibu = 'El IBU es obligatorio';
    if (!formData.pricePerLiter?.trim()) errors.pricePerLiter = 'El precio es obligatorio';

    // Validate numeric fields
    if (formData.abv && (isNaN(Number(formData.abv)) || Number(formData.abv) < 0)) {
      errors.abv = 'El ABV debe ser un número válido';
    }
    if (formData.ibu && (isNaN(Number(formData.ibu)) || Number(formData.ibu) < 0)) {
      errors.ibu = 'El IBU debe ser un número válido';
    }
    if (formData.pricePerLiter && (isNaN(Number(formData.pricePerLiter)) || Number(formData.pricePerLiter) < 0)) {
      errors.pricePerLiter = 'El precio debe ser un número válido';
    }
    if (formData.stock && (isNaN(Number(formData.stock)) || Number(formData.stock) < 0)) {
      errors.stock = 'El stock debe ser un número válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const styleId = parseInt(formData.style);
        if (isNaN(styleId)) {
          setFormErrors({...formErrors, style: 'Debe seleccionar un estilo válido'});
          return;
        }
        const selectedStyleName = beerStyles?.find((s) => s.id === styleId)?.name;

        // Convertir imagen a base64 si existe
        let imagenUrl: string | undefined = undefined;
        if (formData.photo) {
          try {
            imagenUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(formData.photo!);
            });
          } catch {
          }
        }

        if (editingBeer) {
          // Editando cerveza existente
          const updateData: UpdateBeerRequest = {
            nombre: formData.name,
            proveedor: formData.brewery,
            tipo: selectedStyleName || formData.brewery,
            estilos_ids: [styleId],
            abv: parseFloat(formData.abv),
            ibu: parseInt(formData.ibu),
            activo: editingBeer.active, // Mantener el estado actual
            imagen: imagenUrl,
            precio_nuevo: Number(formData.pricePerLiter),
            motivo_precio: 'Actualización desde la app',
            stock_base: Number(formData.stock),
          };
          await updateBeer(editingBeer.id, updateData);
        } else {
          // Creando nueva cerveza
          const createData: CreateBeerRequest = {
            nombre: formData.name,
            proveedor: formData.brewery,
            tipo: selectedStyleName || formData.brewery,
            estilos_ids: [styleId],
            abv: parseFloat(formData.abv),
            ibu: parseInt(formData.ibu),
            activo: true,
            imagen: imagenUrl,
            precio_inicial: Number(formData.pricePerLiter),
            stock_base: Number(formData.stock),
          };
          await createBeer(createData);
        }

        // Recargar la lista después de la operación
        fetchBeers();
        closeModal();
      } catch (error: any) {
        // Aquí podrías mostrar un mensaje de error al usuario
        const errorMsg = error.response?.data?.detail || 'Error al guardar la cerveza';
        alert(errorMsg);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  const handleAddBeer = () => {
    openModal();
  };

  const selectedStyleNameForEquipment =
    isEquipmentModalOpen && equipmentForm.id_estilo
      ? beerStyles?.find((s) => s.id.toString() === equipmentForm.id_estilo)?.name
      : undefined;
  const beersForEquipmentModal = selectedStyleNameForEquipment
    ? activeBeersList.filter(
        (beer) =>
          beer.style === selectedStyleNameForEquipment ||
          (Array.isArray(beer.styles) && beer.styles.includes(selectedStyleNameForEquipment))
      )
    : activeBeersList;

  const openEquipmentModal = async () => {
    setEquipmentFormError('');
    await loadActiveBeers();
    setEquipmentForm({
      nombre_equipo: '',
      id_barril: barrelTypes[0]?.id?.toString?.() || '',
      id_estado_equipo: equipmentStates[0]?.id?.toString?.() || '',
      id_estilo: '',
      id_cerveza: '',
      id_punto_de_venta: puntosVenta[0]?.id?.toString?.() || '',
      temperatura_actual: '',
      capacidad_actual: barrelTypes[0]?.capacity?.toString?.() || '',
      ultima_limpieza: '',
      proxima_limpieza: '',
    });
    setIsEquipmentModalOpen(true);
  };

  const closeEquipmentModal = () => {
    setIsEquipmentModalOpen(false);
    setEquipmentFormError('');
  };

  useEffect(() => {
    if (!isEquipmentModalOpen) return;
    const barrel = barrelTypes.find((b) => b.id.toString() === equipmentForm.id_barril);
    if (!barrel) return;
    setEquipmentForm((prev) => ({
      ...prev,
      capacidad_actual: barrel.capacity.toString(),
    }));
  }, [equipmentForm.id_barril, isEquipmentModalOpen, barrelTypes]);

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEquipmentFormError('');

    const id_barril = Number(equipmentForm.id_barril);
    const id_estado_equipo = Number(equipmentForm.id_estado_equipo);
    const id_cerveza = equipmentForm.id_cerveza ? Number(equipmentForm.id_cerveza) : null;
    const id_punto_de_venta = equipmentForm.id_punto_de_venta ? Number(equipmentForm.id_punto_de_venta) : null;
    const temperatura_actual = equipmentForm.temperatura_actual ? Number(equipmentForm.temperatura_actual) : null;
    const capacidad_actual = Number(equipmentForm.capacidad_actual);
    const ultima_limpieza = equipmentForm.ultima_limpieza || null;
    const proxima_limpieza = equipmentForm.proxima_limpieza || null;

    const requierePuntoVenta = puntosVenta.length > 0;
    if (!id_barril || !id_estado_equipo || (requierePuntoVenta && !id_punto_de_venta) || isNaN(capacidad_actual)) {
      setEquipmentFormError('Completá los campos obligatorios');
      return;
    }

    try {
      await createEquipment({
        nombre_equipo: equipmentForm.nombre_equipo || null,
        id_barril,
        id_estado_equipo,
        id_cerveza,
        id_punto_de_venta: requierePuntoVenta ? id_punto_de_venta : null,
        temperatura_actual,
        capacidad_actual,
        ultima_limpieza,
        proxima_limpieza,
      });
      await fetchEquipment(1);
      closeEquipmentModal();
    } catch (error: any) {
      setEquipmentFormError(error?.response?.data?.detail || 'Error al crear la canilla');
    }
  };

  const handleChangeBeer = (equipmentId: number) => {
    const equipo = equipment.find(e => e.id === equipmentId);
    if (equipo) {
      setSelectedTap(equipo);
      setSelectedNewBeer('');
      setSelectedBarrelTypeId(equipo.barrelTypeId ?? null);
      setSelectedCapacity(equipo.barrelCapacity ?? null);
      setShowSummary(false);
      setIsChangeTapModalOpen(true);
    }
  };

  const handleToggleCanilla = async (equipmentId: number) => {
    try {
      await toggleEquipmentStatus(equipmentId);
      // Recargar la lista después del cambio
      await fetchEquipment();
    } catch {
      alert('Error al cambiar estado del equipo');
    }
  };

  const handleDeleteCanilla = async (equipmentId: number) => {
    const ok = window.confirm('¿Eliminar esta canilla? Esta acción no se puede deshacer.');
    if (!ok) return;
    try {
      await deleteEquipment(equipmentId);
      await fetchEquipment(1);
    } catch (error: any) {
      alert(error?.response?.data?.detail || 'Error al eliminar la canilla');
    }
  };

  // Change Tap Modal functions
  const closeChangeTapModal = () => {
    setIsChangeTapModalOpen(false);
    setSelectedTap(null);
    setSelectedNewBeer('');
    setSelectedBarrelTypeId(null);
    setSelectedCapacity(null);
    setShowSummary(false);
    setCapacityError('');
  };

  const handleNewBeerChange = (beerName: string) => {
    setSelectedNewBeer(beerName);
    if (beerName && selectedCapacity !== null) {
      setShowSummary(true);
    }
  };

  const handleCapacitySelect = (barrelTypeId: number, capacity: number) => {
    // Clear previous error
    setCapacityError('');
    
    // Validate capacity against barrel maximum
    if (capacity < 0) {
      setCapacityError('La capacidad no puede ser negativa');
      return;
    }

    setSelectedBarrelTypeId(barrelTypeId);
    setSelectedCapacity(capacity);
    if (selectedNewBeer && capacity !== null) {
      setShowSummary(true);
    }
  };

  const handleConfirmChange = async () => {
    // Validate that there are no capacity errors before proceeding
    if (capacityError) {
      return;
    }
    
    if (selectedTap && selectedNewBeer && selectedCapacity !== null) {
      try {
        // Buscar la cerveza seleccionada por ID (no por nombre)
        const selectedBeerObj = beers.find(b => b.id.toString() === selectedNewBeer);
        if (!selectedBeerObj) {
          setCapacityError('Cerveza seleccionada inválida');
          return;
        }

        const changeData: ChangeBeerRequest = {
          id_cerveza: selectedBeerObj.id,
          capacidad_nueva: selectedCapacity,
          id_barril: selectedBarrelTypeId ?? undefined,
          motivo: 'Cambio de cerveza desde interfaz'
        };

        await changeBeerInEquipment(selectedTap.id, changeData);
        
        // Recargar la lista después del cambio
        fetchEquipment();
        closeChangeTapModal();
      } catch {
        alert('Error al cambiar cerveza en el equipo');
      }
    }
  };

  // Función para determinar el estado del stock basado en la cantidad
  const getEstadoStock = (stock: number): 'agotado' | 'bajo' | 'medio' | 'alto' => {
    if (stock <= 0) return 'agotado';
    if (stock <= 10) return 'bajo';
    if (stock <= 50) return 'medio';
    return 'alto';
  };

  const getStockColor = (stock: number) => {
    const status = getEstadoStock(stock);
    switch (status) {
      case 'agotado': return 'red';
      case 'bajo': return 'yellow';
      case 'medio': return 'orange';
      case 'alto': return 'green';
      default: return 'gray';
    }
  };

  const getStyleBadgeColor = (style: string) => {
    const styleColors: { [key: string]: string } = {
      'IPA': 'yellow',
      'Stout': 'purple',
      'Lager': 'blue',
      'Pilsner': 'green',
      'Red Ale': 'red',
      'Wheat': 'orange'
    };
    return styleColors[style] || 'gray';
  };

  const getBarrelLevelText = (level: number) => {
    if (level >= 70) return 'Alto';
    if (level >= 30) return 'Medio';
    return 'Bajo';
  };

  // Función auxiliar para obtener el color del nivel de barril
  const getBarrelLevelColor = (level: number): string => {
    const estado = determinarEstadoNivel(level);
    switch (estado) {
      case 'critico':
        return styles.low;
      case 'bajo':
        return styles.low;
      case 'medio':
        return styles.medium;
      case 'alto':
        return styles.high;
      default:
        return styles.medium;
    }
  };

  const renderBeerCard = (beer: Beer) => (
    <div key={beer.id} className={styles.beerCard}>
      <div className={styles.beerCardHeader}>
        <div className={styles.beerIcon}>
          {beer.image ? (
            <img
              src={beer.image}
              alt={beer.name}
              className={styles.beerImage}
              onError={(e) => {
                // Fallback al SVG si la imagen falla
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove(styles.hidden);
              }}
            />
          ) : null}
          <svg
            width="75"
            height="75"
            viewBox="0 0 75 75"
            fill="none"
            className={beer.image ? styles.hidden : ''}
          >
            <path d="M20 15h35v45H20z" fill="white" opacity="0.8"/>
            <path d="M25 20h25v35H25z" fill="white" opacity="0.6"/>
            <circle cx="37.5" cy="37.5" r="15" fill="white"/>
          </svg>
        </div>
      </div>
      <div className={styles.beerCardContent}>
        <div className={styles.beerCardTitle}>
          <div className={styles.beerInfo}>
            <h3 className={styles.beerName}>{beer.name}</h3>
            <p className={styles.brewery}>{beer.brewery}</p>
          </div>
          <div className={`${styles.statusBadge} ${styles[beer.status.toLowerCase()]}`}>
            <span>{beer.status}</span>
          </div>
        </div>
        
        <div className={styles.beerDetails}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Estilo</span>
            <span className={styles.value}>{beer.style}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>ABV / IBU</span>
            <span className={styles.value}>{beer.abv}% / {beer.ibu}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Precio/L</span>
            <span className={styles.price}>{formatearPrecio((beer as any).currentPrice || 0)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Stock</span>
            <span className={styles.stock}>{(beer as any).stock || 0}L</span>
          </div>
        </div>

        <div className={styles.beerActions}>
          <button
            className={styles.editButton}
            onClick={() => handleEdit(beer.id)}
          >
            <Edit size={16} />
            <span>Editar</span>
          </button>
          <button
            className={`${styles.deleteButton} ${beer.active ? styles.deactivate : styles.activate}`}
            onClick={() => (beer.active ? handleDeleteBeer(beer.id) : handleActivateBeer(beer.id))}
            title={beer.active ? 'Eliminar cerveza' : 'Activar cerveza'}
          >
            {beer.active ? <Trash2 size={16} /> : <Power size={16} />}
            <span>{beer.active ? 'Eliminar' : 'Activar'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderBeerTable = () => (
    <div className={styles.tableContainer}>
      <table className={styles.beerTable}>
        <thead>
          <tr>
            <th>Cerveza</th>
            <th>Estilo</th>
            <th>ABV</th>
            <th>IBU</th>
            <th>Precio/L</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(paginatedData as Beer[]).map((beer) => (
            <tr key={beer.id}>
              <td className={styles.beerNameCell}>
                <div className={styles.beerIconSmall}>
                  {beer.image ? (
                    <img
                      src={beer.image}
                      alt={beer.name}
                      className={styles.beerImageSmall}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove(styles.hidden);
                      }}
                    />
                  ) : null}
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    className={beer.image ? styles.hidden : ''}
                  >
                    <defs>
                      <linearGradient id={`gradient-${beer.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF8C00" />
                        <stop offset="100%" stopColor="#FFD700" />
                      </linearGradient>
                    </defs>
                    <path d="M8 6h16v20H8z" fill={`url(#gradient-${beer.id})`} opacity="0.8"/>
                    <path d="M10 8h12v16H10z" fill={`url(#gradient-${beer.id})`} opacity="0.6"/>
                    <circle cx="16" cy="16" r="6" fill={`url(#gradient-${beer.id})`}/>
                  </svg>
                </div>
                <div className={styles.beerNameInfo}>
                  <span className={styles.beerName}>{beer.name}</span>
                  <span className={styles.brewery}>{beer.brewery}</span>
                </div>
              </td>
              <td>
                <span className={`${styles.styleBadge} ${styles[getStyleBadgeColor(beer.style)]}`}>
                  {beer.style}
                </span>
              </td>
              <td>{beer.abv}%</td>
              <td>{beer.ibu}</td>
              <td className={styles.priceCell}>{formatearPrecio((beer as any).currentPrice || 0)}</td>
              <td className={`${styles.stockCell} ${styles[getStockColor((beer as any).stock || 0)]}`}>
                {(beer as any).stock || 0}L
              </td>
              <td>
                <span className={`${styles.statusBadge} ${styles[beer.active ? 'activa' : 'inactiva']}`}>
                  {beer.active ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td className={styles.actionsCell}>
                <button
                  className={styles.editButton}
                  onClick={() => handleEdit(beer.id)}
                  title="Editar cerveza"
                >
                  <Edit size={14} />
                </button>
                <button
                  className={`${styles.deleteButton} ${beer.active ? styles.deactivate : styles.activate}`}
                  onClick={() => (beer.active ? handleDeleteBeer(beer.id) : handleActivateBeer(beer.id))}
                  title={beer.active ? 'Eliminar cerveza' : 'Activar cerveza'}
                >
                  {beer.active ? <Trash2 size={14} /> : <Power size={14} />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCanillaTable = () => (
    <div className={styles.tableContainer}>
      <table className={styles.beerTable}>
        <thead>
          <tr>
            <th>Canilla</th>
            <th>Ubicación</th>
            <th>Cerveza Actual</th>
            <th>Nivel del Barril</th>
            <th>Volumen</th>
            <th>Temperatura</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(paginatedData as Canilla[]).map((canilla) => {
            const barrelLevel = canilla.barrelLevel || 0;
            const levelColor = getBarrelLevelColor(barrelLevel);
            
            return (
              <tr key={canilla.id}>
                <td className={styles.beerNameCell}>
                  <div className={styles.beerIconSmall}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <defs>
                        <linearGradient id={`tap-gradient-${canilla.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4A90E2" />
                          <stop offset="100%" stopColor="#7B68EE" />
                        </linearGradient>
                      </defs>
                      <rect x="8" y="6" width="16" height="20" fill={`url(#tap-gradient-${canilla.id})`} opacity="0.8" rx="2"/>
                      <rect x="10" y="8" width="12" height="16" fill={`url(#tap-gradient-${canilla.id})`} opacity="0.6" rx="1"/>
                      <circle cx="16" cy="16" r="6" fill={`url(#tap-gradient-${canilla.id})`}/>
                    </svg>
                  </div>
                  <div className={styles.beerNameInfo}>
                    <span className={styles.beerName}>{canilla.name}</span>
                    <span className={styles.brewery}>{canilla.location}</span>
                  </div>
                </td>
                <td>{canilla.location}</td>
                <td>{canilla.currentBeer || 'Sin cerveza'}</td>
                <td className={styles.barrelLevelCell}>
                  <div className={styles.barrelLevelContent}>
                    <div className={styles.barrelLevelInfo}>
                      <span className={`${styles.barrelLevelText} ${levelColor}`}>
                        {barrelLevel}%
                      </span>
                      <span className={styles.barrelLevelStatus}>
                        ({getBarrelLevelText(barrelLevel)})
                      </span>
                    </div>
                    <div className={styles.progressBarTable}>
                      <div
                        className={`${styles.progressFill} ${levelColor}`}
                        style={{ width: `${barrelLevel}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>{canilla.currentVolume || 0}L / {canilla.barrelCapacity || 0}L</td>
                <td>{canilla.temperature || 0}°C</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[canilla.active ? 'online' : 'offline']}`}>
                    {canilla.active ? 'En Línea' : 'Fuera de Línea'}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button 
                    className={styles.editButton}
                    onClick={() => handleChangeBeer(canilla.id)}
                    title="Cambiar cerveza"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button 
                    className={`${styles.deleteButton} ${canilla.active ? styles.deactivate : styles.activate}`}
                    onClick={() => handleToggleCanilla(canilla.id)}
                    title={canilla.active ? 'Desactivar' : 'Activar'}
                  >
                    {canilla.active ? <PowerOff size={14} /> : <Power size={14} />}
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteCanilla(canilla.id)}
                    title="Eliminar canilla"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCanillaCard = (canilla: Canilla) => {
    const barrelLevel = canilla.barrelLevel || 0;
    const levelColor = getBarrelLevelColor(barrelLevel);
    
    return (
      <div key={canilla.id} className={`${styles.canillaCard} ${!canilla.active ? styles.offline : ''}`}>
        <div className={styles.canillaHeader}>
          <div className={styles.canillaInfo}>
            <h3 className={styles.canillaName}>{canilla.name}</h3>
            <p className={styles.canillaLocation}>{canilla.location}</p>
          </div>
          <div className={`${styles.statusBadge} ${styles[canilla.active ? 'online' : 'offline']}`}>
            <span>{canilla.active ? 'En Línea' : 'Fuera de Línea'}</span>
          </div>
        </div>

        <div className={styles.canillaContent}>
          <div className={styles.canillaDetail}>
            <span className={styles.label}>Cerveza Actual</span>
            <span className={styles.value}>{canilla.currentBeer || 'Sin cerveza'}</span>
          </div>

          <div className={styles.barrelSection}>
            <div className={styles.barrelInfo}>
              <span className={styles.label}>Nivel del Barril</span>
              <span className={`${styles.barrelLevel} ${levelColor}`}>
                {barrelLevel}% ({getBarrelLevelText(barrelLevel)})
              </span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={`${styles.progressFill} ${levelColor}`}
                style={{ width: `${barrelLevel}%` }}
              />
            </div>
            <span className={styles.volumeText}>
              {canilla.currentVolume || 0}L de {canilla.barrelCapacity || 0}L
            </span>
          </div>

          <div className={styles.canillaDetail}>
            <span className={styles.label}>Temperatura</span>
            <span className={styles.value}>{canilla.temperature || 0}°C</span>
          </div>
        </div>

        <div className={styles.cardDivider} />

        <div className={styles.canillaActions}>
          <button 
            className={styles.changeButton}
            onClick={() => handleChangeBeer(canilla.id)}
          >
            <RotateCcw size={16} />
            <span>Cambiar</span>
          </button>
          <button 
            className={`${styles.toggleButton} ${canilla.active ? styles.deactivate : styles.activate}`}
            onClick={() => handleToggleCanilla(canilla.id)}
          >
            {canilla.active ? (
              <>
                <PowerOff size={16} />
                <span>Desactivar</span>
              </>
            ) : (
              <>
                <Power size={16} />
                <span>Activar</span>
              </>
            )}
          </button>
          <button
            className={styles.deleteCanillaButton}
            onClick={() => handleDeleteCanilla(canilla.id)}
          >
            <Trash2 size={16} />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'cervezas' ? styles.active : ''}`}
          onClick={() => setActiveTab('cervezas')}
        >
          Cervezas
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'canillas' ? styles.active : ''}`}
          onClick={() => setActiveTab('canillas')}
        >
          Canillas
        </button>
      </div>

      {/* Filtros y controles - Solo para cervezas y canillas */}
      {(activeTab === 'cervezas' || activeTab === 'canillas') && (
        <div className={styles.controls}>
        {/* Barra de búsqueda */}
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={activeTab === 'cervezas' ? "Buscar cerveza..." : "Buscar canilla..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {activeTab === 'cervezas' ? (
          <>
            {/* Orden por nombres */}
            <div className={styles.filterDropdown}>
              <Filter size={18} className={styles.filterIcon} />
              <button
                type="button"
                className={styles.filterButton}
                onClick={() => setIsNameSortOpen((v) => !v)}
              >
                Nombres
              </button>
              <ChevronDown size={18} className={styles.dropdownIcon} />
              {isNameSortOpen && (
                <div className={styles.filterMenu}>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${nameSort === 'asc' ? styles.selected : ''}`}
                    onClick={() => {
                      setNameSort('asc');
                      setIsNameSortOpen(false);
                    }}
                  >
                    A–Z
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${nameSort === 'desc' ? styles.selected : ''}`}
                    onClick={() => {
                      setNameSort('desc');
                      setIsNameSortOpen(false);
                    }}
                  >
                    Z–A
                  </button>
                </div>
              )}
            </div>

            {/* Filtro de estados */}
            <div className={styles.filterDropdown}>
              <Filter size={18} className={styles.filterIcon} />
              <button
                type="button"
                className={styles.filterButton}
                onClick={() => setIsBeerStatusOpen((v) => !v)}
              >
                Estados
              </button>
              <ChevronDown size={18} className={styles.dropdownIcon} />
              {isBeerStatusOpen && (
                <div className={styles.filterMenu}>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${statusFilter === '' ? styles.selected : ''}`}
                    onClick={() => {
                      setStatusFilter('');
                      setIsBeerStatusOpen(false);
                    }}
                  >
                    Todos los estados
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${statusFilter === 'Activa' ? styles.selected : ''}`}
                    onClick={() => {
                      setStatusFilter('Activa');
                      setIsBeerStatusOpen(false);
                    }}
                  >
                    Activa
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${statusFilter === 'Inactiva' ? styles.selected : ''}`}
                    onClick={() => {
                      setStatusFilter('Inactiva');
                      setIsBeerStatusOpen(false);
                    }}
                  >
                    Inactiva
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={styles.filterDropdown}>
              <Filter size={18} className={styles.filterIcon} />
              <button
                type="button"
                className={styles.filterButton}
                onClick={() => setIsNameSortOpen((v) => !v)}
              >
                Nombres
              </button>
              <ChevronDown size={18} className={styles.dropdownIcon} />
              {isNameSortOpen && (
                <div className={styles.filterMenu}>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${nameSort === 'asc' ? styles.selected : ''}`}
                    onClick={() => {
                      setNameSort('asc');
                      setIsNameSortOpen(false);
                    }}
                  >
                    A–Z
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${nameSort === 'desc' ? styles.selected : ''}`}
                    onClick={() => {
                      setNameSort('desc');
                      setIsNameSortOpen(false);
                    }}
                  >
                    Z–A
                  </button>
                </div>
              )}
            </div>

            {/* Filtro de estados */}
            <div className={styles.filterDropdown}>
              <Filter size={18} className={styles.filterIcon} />
              <button
                type="button"
                className={styles.filterButton}
                onClick={() => setIsCanillaStatusOpen((v) => !v)}
              >
                Estados
              </button>
              <ChevronDown size={18} className={styles.dropdownIcon} />
              {isCanillaStatusOpen && (
                <div className={styles.filterMenu}>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${selectedCanillaStatus === '' ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedCanillaStatus('');
                      setIsCanillaStatusOpen(false);
                    }}
                  >
                    Todos los estados
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${selectedCanillaStatus === 'En Línea' ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedCanillaStatus('En Línea');
                      setIsCanillaStatusOpen(false);
                    }}
                  >
                    En Línea
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterMenuItem} ${selectedCanillaStatus === 'Fuera de Línea' ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedCanillaStatus('Fuera de Línea');
                      setIsCanillaStatusOpen(false);
                    }}
                  >
                    Fuera de Línea
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Botones de vista */}
        <div className={styles.viewButtons}>
          <button 
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={16} />
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </button>
        </div>

        {/* Botón agregar cerveza */}
        {activeTab === 'cervezas' && (
          <button className={styles.addButton} onClick={handleAddBeer}>
            <Plus size={16} />
            <span>Agregar Cerveza</span>
          </button>
        )}
        {activeTab === 'canillas' && (
          <button className={`${styles.addButton} ${styles.addCanillaButton}`} onClick={openEquipmentModal}>
            <Plus size={16} />
            <span>Agregar Canilla</span>
          </button>
        )}
        </div>
      )}

      {/* Contenido principal */}
      {activeTab === 'cervezas' ? (
        viewMode === 'grid' ? (
          <div className={styles.beersGrid}>
            {(paginatedData as Beer[]).map(renderBeerCard)}
          </div>
        ) : (
          renderBeerTable()
        )
      ) : activeTab === 'canillas' ? (
        viewMode === 'grid' ? (
          <div className={styles.canillasGrid}>
            {(paginatedData as Canilla[]).map(renderCanillaCard)}
          </div>
        ) : (
          renderCanillaTable()
        )
      ) : null}

      {/* Paginación - Solo para cervezas y canillas */}
      {(activeTab === 'cervezas' || activeTab === 'canillas') && (
        <div className={styles.pagination}>
        <span className={styles.paginationInfo}>
          Página {activeTab === 'cervezas' ? beersCurrentPage : equipmentCurrentPage} de {activeTab === 'cervezas' ? beersTotalPages : equipmentTotalPages}
        </span>
        
        <div className={styles.paginationControls}>
          <button 
            className={styles.paginationButton}
            onClick={() => {
              if (activeTab === 'cervezas') {
                const newPage = Math.max(beersCurrentPage - 1, 1);
                if (newPage !== beersCurrentPage) {
                  fetchBeers(newPage);
                }
              } else {
                const newPage = Math.max(equipmentCurrentPage - 1, 1);
                if (newPage !== equipmentCurrentPage) {
                  fetchEquipment(newPage);
                }
              }
            }}
            disabled={activeTab === 'cervezas' ? beersCurrentPage === 1 : equipmentCurrentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          {(() => {
            const current = activeTab === 'cervezas' ? beersCurrentPage : equipmentCurrentPage;
            const total = activeTab === 'cervezas' ? beersTotalPages : equipmentTotalPages;
            const setPage = (p: number) => {
              if (activeTab === 'cervezas') fetchBeers(p);
              else fetchEquipment(p);
            };

            return getPaginationItems(current, total).map((item, idx) => {
              if (item === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className={styles.paginationEllipsis}>
                    …
                  </span>
                );
              }

              return (
                <button
                  key={`page-${item}-${idx}`}
                  type="button"
                  className={`${styles.pageButton} ${current === item ? styles.active : ''}`}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              );
            });
          })()}
          
          <button 
            className={styles.paginationButton}
            onClick={() => {
              if (activeTab === 'cervezas') {
                const newPage = Math.min(beersCurrentPage + 1, beersTotalPages);
                if (newPage !== beersCurrentPage) {
                  fetchBeers(newPage);
                }
              } else {
                const newPage = Math.min(equipmentCurrentPage + 1, equipmentTotalPages);
                if (newPage !== equipmentCurrentPage) {
                  fetchEquipment(newPage);
                }
              }
            }}
            disabled={activeTab === 'cervezas' ? beersCurrentPage === beersTotalPages : equipmentCurrentPage === equipmentTotalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        </div>
      )}

      {/* Modal Agregar Cerveza */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal} onKeyDown={handleKeyDown}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingBeer ? `Editar Cerveza ${editingBeer.name}` : 'Agregar Nueva Cerveza'}
              </h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {/* Photo Upload Section */}
              <div className={styles.photoSection}>
                <label className={styles.photoLabel}>
                  {editingBeer ? 'Seleccionar Nueva Foto' : 'Subir foto'} <span className={styles.required}>*</span>
                </label>
                <div 
                  className={`${styles.photoUpload} ${isDragOver ? styles.dragOver : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={32} className={styles.uploadIcon} />
                  <p className={styles.uploadText}>
                    {editingBeer 
                      ? 'Arrastra y suelta una nueva foto aquí o haz clic para seleccionar'
                      : 'Arrastra y suelta una foto aquí o haz clic para seleccionar'
                    }
                  </p>
                  {editingBeer && !formData.photo && (
                    <p className={styles.currentPhotoText}>Foto actual: {editingBeer.name}.jpg</p>
                  )}
                  {formData.photo && (
                    <p className={styles.fileName}>{formData.photo.name}</p>
                  )}
                  <button type="button" className={styles.selectPhotoButton}>
                    {editingBeer ? 'Seleccionar Nueva Foto' : 'Seleccionar foto'}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className={styles.hiddenFileInput}
                />
                {formErrors.photo && <span className={styles.errorText}>{formErrors.photo}</span>}
              </div>

              {/* Form Fields */}
              <div className={styles.formGrid}>
                {/* Nombre de la Cerveza */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Nombre de la Cerveza <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Escribe aquí..."
                    className={`${styles.fieldInput} ${formErrors.name ? styles.error : ''}`}
                  />
                  {formErrors.name && <span className={styles.errorText}>{formErrors.name}</span>}
                </div>

                {/* Cervecería */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Cervecería <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.brewery}
                    onChange={(e) => handleInputChange('brewery', e.target.value)}
                    placeholder="Escribe aquí..."
                    className={`${styles.fieldInput} ${formErrors.brewery ? styles.error : ''}`}
                  />
                  {formErrors.brewery && <span className={styles.errorText}>{formErrors.brewery}</span>}
                </div>

                {/* Estilo */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Estilo <span className={styles.required}>*</span>
                    <button type="button" className={styles.manageStylesButton} onClick={openStyleModal}>
                      Administrar
                    </button>
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      value={formData.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                      className={`${styles.fieldSelect} ${formErrors.style ? styles.error : ''}`}
                    >
                      <option key="select-style" value="">Selecciona un estilo</option>
                      {beerStyles?.map(style => (
                        <option key={style.id} value={style.id.toString()}>{style.name}</option>
                      )) || []}
                    </select>
                    <ChevronDown size={16} className={styles.selectIcon} />
                  </div>
                  {formErrors.style && <span className={styles.errorText}>{formErrors.style}</span>}
                </div>

                {/* País de Origen */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    País de Origen <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Escribe aquí..."
                    className={`${styles.fieldInput} ${formErrors.country ? styles.error : ''}`}
                  />
                  {formErrors.country && <span className={styles.errorText}>{formErrors.country}</span>}
                </div>

                {/* ABV */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    ABV (%) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.abv}
                    onChange={(e) => handleInputChange('abv', e.target.value)}
                    placeholder="Escribe aquí..."
                    className={`${styles.fieldInput} ${formErrors.abv ? styles.error : ''}`}
                  />
                  {formErrors.abv && <span className={styles.errorText}>{formErrors.abv}</span>}
                </div>

                {/* IBU */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    IBU <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ibu}
                    onChange={(e) => handleInputChange('ibu', e.target.value)}
                    placeholder="Escribe aquí..."
                    className={`${styles.fieldInput} ${formErrors.ibu ? styles.error : ''}`}
                  />
                  {formErrors.ibu && <span className={styles.errorText}>{formErrors.ibu}</span>}
                </div>

                {/* Precio/L */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Precio/L ($) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pricePerLiter}
                    onChange={(e) => handleInputChange('pricePerLiter', e.target.value)}
                    placeholder="Escribe aquí..."
                    className={`${styles.fieldInput} ${formErrors.pricePerLiter ? styles.error : ''}`}
                  />
                  {formErrors.pricePerLiter && <span className={styles.errorText}>{formErrors.pricePerLiter}</span>}
                </div>

                {/* Stock */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Stock (L)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    placeholder="Escribe aquí..."
                    className={`${styles.fieldInput} ${formErrors.stock ? styles.error : ''}`}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                  />
                  {formErrors.stock && <span className={styles.errorText}>{formErrors.stock}</span>}
                </div>
              </div>

              {/* Modal Actions */}
              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  {editingBeer ? 'Guardar Datos' : 'Agregar Cerveza'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isStyleModalOpen && (
        <div className={styles.modalOverlay} onClick={closeStyleModal}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Administrar estilos</h2>
              <button className={styles.closeButton} onClick={closeStyleModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStyle} className={styles.modalForm}>
              {styleFormError && <div className={styles.errorMessage}>{styleFormError}</div>}

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Nombre <span className={styles.required}>*</span>
                  </label>
                  <input
                    className={styles.fieldInput}
                    value={styleForm.estilo}
                    onChange={(e) => setStyleForm((p) => ({ ...p, estilo: e.target.value }))}
                    placeholder="NEIPA"
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Origen</label>
                  <input
                    className={styles.fieldInput}
                    value={styleForm.origen}
                    onChange={(e) => setStyleForm((p) => ({ ...p, origen: e.target.value }))}
                    placeholder="Argentina"
                  />
                </div>

                <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.fieldLabel}>Descripción</label>
                  <input
                    className={styles.fieldInput}
                    value={styleForm.descripcion}
                    onChange={(e) => setStyleForm((p) => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  Agregar estilo
                </button>
              </div>

              <div className={styles.stylesList}>
                {(beerStyles || []).map((s) => (
                  <div key={s.id} className={styles.styleRow}>
                    <div className={styles.styleName}>{s.name}</div>
                    <button type="button" className={styles.iconButton} onClick={() => handleDeleteStyle(s.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {(beerStyles || []).length === 0 && <div className={styles.emptyStyles}>Sin estilos</div>}
              </div>
            </form>
          </div>
        </div>
      )}

      {isEquipmentModalOpen && (
        <div className={styles.modalOverlay} onClick={closeEquipmentModal}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Agregar Canilla</h2>
              <button className={styles.closeButton} onClick={closeEquipmentModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEquipment} className={styles.modalForm}>
              {equipmentFormError && (
                <div className={styles.errorMessage}>{equipmentFormError}</div>
              )}

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Nombre</label>
                  <input
                    className={styles.fieldInput}
                    value={equipmentForm.nombre_equipo}
                    onChange={(e) => setEquipmentForm((p) => ({ ...p, nombre_equipo: e.target.value }))}
                    placeholder="Escriba aquí..."
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Tipo de Barril <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.fieldSelect}
                      value={equipmentForm.id_barril}
                      onChange={(e) => setEquipmentForm((p) => ({ ...p, id_barril: e.target.value }))}
                    >
                      {barrelTypes.length === 0 && <option value="">Sin tipos de barril</option>}
                      {barrelTypes.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.capacity}L
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className={styles.selectIcon} />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Estado <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.fieldSelect}
                      value={equipmentForm.id_estado_equipo}
                      onChange={(e) => setEquipmentForm((p) => ({ ...p, id_estado_equipo: e.target.value }))}
                    >
                      {equipmentStates.length === 0 && <option value="">Sin estados</option>}
                      {equipmentStates.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className={styles.selectIcon} />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Estilo</label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.fieldSelect}
                      value={equipmentForm.id_estilo}
                      onChange={(e) =>
                        setEquipmentForm((p) => ({ ...p, id_estilo: e.target.value, id_cerveza: '' }))
                      }
                    >
                      <option value="">Todos los estilos</option>
                      {beerStyles?.map((style) => (
                        <option key={style.id} value={style.id.toString()}>
                          {style.name}
                        </option>
                      )) || []}
                    </select>
                    <ChevronDown size={16} className={styles.selectIcon} />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Cerveza (opcional)</label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.fieldSelect}
                      value={equipmentForm.id_cerveza}
                      onChange={(e) => setEquipmentForm((p) => ({ ...p, id_cerveza: e.target.value }))}
                    >
                      <option value="">Sin cerveza</option>
                      {beersForEquipmentModal.map((beer) => (
                        <option key={beer.id} value={beer.id}>
                          {beer.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className={styles.selectIcon} />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Stock Inicial (Litros) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={equipmentForm.capacidad_actual}
                    onChange={(e) => setEquipmentForm((p) => ({ ...p, capacidad_actual: e.target.value }))}
                    min={0}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Temperatura (°C)</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={equipmentForm.temperatura_actual}
                    onChange={(e) => setEquipmentForm((p) => ({ ...p, temperatura_actual: e.target.value }))}
                    step="0.1"
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Punto de venta <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.fieldSelect}
                      value={equipmentForm.id_punto_de_venta}
                      onChange={(e) => setEquipmentForm((p) => ({ ...p, id_punto_de_venta: e.target.value }))}
                    >
                      <option value="">
                        {puntosVenta.length === 0 ? "Se creará 'Principal' automáticamente" : 'Selecciona un punto de venta'}
                      </option>
                      {puntosVenta.map((pv) => (
                        <option key={pv.id} value={pv.id}>
                          {pv.nombre}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className={styles.selectIcon} />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Última limpieza</label>
                  <input
                    type="date"
                    className={styles.fieldInput}
                    value={equipmentForm.ultima_limpieza}
                    onChange={(e) => setEquipmentForm((p) => ({ ...p, ultima_limpieza: e.target.value }))}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Próxima limpieza</label>
                  <input
                    type="date"
                    className={styles.fieldInput}
                    value={equipmentForm.proxima_limpieza}
                    onChange={(e) => setEquipmentForm((p) => ({ ...p, proxima_limpieza: e.target.value }))}
                  />
                </div>
              </div>

              <button type="submit" className={styles.equipmentSubmitButton}>
                Agregar Canilla
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Canilla */}
      {isChangeTapModalOpen && selectedTap && (
        <div className={styles.modalOverlay} onClick={closeChangeTapModal}>
          <div className={styles.changeTapModalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Cambiar Barril - Canilla {selectedTap.id}
              </h2>
              <button className={styles.closeButton} onClick={closeChangeTapModal}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.changeTapForm}>
              {/* Nueva Cerveza Dropdown */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Nueva Cerveza <span className={styles.required}>*</span>
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    value={selectedNewBeer}
                    onChange={(e) => handleNewBeerChange(e.target.value)}
                    className={styles.fieldSelect}
                  >
                    <option key="select-beer" value="">Selecciona una cerveza</option>
                    {activeBeersList.map(beer => (
                      <option key={beer.id} value={beer.id.toString()}>
                        {beer.name} (Activa)
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className={styles.selectIcon} />
                </div>
              </div>

              {/* Capacidad Section */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Capacidad <span className={styles.required}>*</span>
                  {selectedTap && (
                    <span className={styles.capacityInfo}>
                      (Máximo: {(selectedCapacity ?? selectedTap.barrelCapacity)}L)
                    </span>
                  )}
                </label>
                <div className={styles.capacitySection}>
                  <input
                    type="number"
                    value={selectedCapacity ?? ''}
                    readOnly
                    placeholder="Selecciona capacidad"
                    className={`${styles.capacityInput} ${capacityError ? styles.error : ''}`}
                  />
                  <div className={styles.capacityButtons}>
                    {barrelTypes.map((barrelType) => (
                      <button
                        key={barrelType.id}
                        type="button"
                        onClick={() => handleCapacitySelect(barrelType.id, barrelType.capacity)}
                        className={`${styles.capacityButton} ${selectedBarrelTypeId === barrelType.id ? styles.selected : ''}`}
                      >
                        {barrelType.capacity}L
                      </button>
                    ))}
                  </div>
                </div>
                {capacityError && (
                  <div className={styles.errorMessage}>
                    {capacityError}
                  </div>
                )}
              </div>

              {/* Info Text */}
              <p className={styles.infoText}>
                El barril se registrará al 100% de su capacidad
              </p>

              {/* Summary Section - Only show when both beer and capacity are selected */}
              {showSummary && selectedNewBeer && selectedCapacity !== null && (
                <div className={styles.summarySection}>
                  <h3 className={styles.summaryTitle}>Resumen del Cambio</h3>
                  <div className={styles.summaryContent}>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Canilla:</span>
                      <span className={styles.summaryValue}>#{selectedTap.id}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Nueva Cerveza:</span>
                      <span className={styles.summaryValue}>
                        {beers.find(beer => beer.id.toString() === selectedNewBeer)?.name || selectedNewBeer}
                      </span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Capacidad:</span>
                      <span className={styles.summaryValue}>{selectedCapacity} Litros</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Estado:</span>
                      <span className={styles.summaryValue}>Activo (100%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={handleConfirmChange}
                  disabled={!selectedNewBeer || selectedCapacity === null || !!capacityError}
                  className={styles.submitButton}
                >
                  Confirmar Cambio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeersAndEquipment;
