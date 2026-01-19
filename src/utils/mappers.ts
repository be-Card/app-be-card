import { 
  CervezaBackend, 
  Beer, 
  EquipoBackend, 
  Canilla,
  TipoEstiloCervezaBackend,
  BeerStyle,
  TipoBarrilBackend,
  BarrelType,
  TipoEstadoEquipoBackend,
  EquipmentState
} from '../types';

// ===== MAPPERS PARA CERVEZAS =====

/**
 * Convierte una cerveza del backend al formato del frontend
 */
export const mapCervezaToFrontend = (cerveza: CervezaBackend): Beer => {
  const mapped = {
    id: cerveza.id,
    name: cerveza.nombre,
    brewery: cerveza.proveedor,  // Cambiado de cerveceria a proveedor
    style: cerveza.estilos?.[0]?.estilo || 'Sin estilo',  // Cambiado de nombre a estilo
    abv: Number((cerveza as any).abv ?? 0),
    ibu: Number((cerveza as any).ibu ?? 0),
    pricePerLiter: cerveza.precio_actual || 0,
    stock: cerveza.stock_total || 0,
    stockBase: (cerveza as any).stock_base ?? 0,
    status: cerveza.activo ? 'Activa' : 'Inactiva',
    description: cerveza.descripcion,
    styles: cerveza.estilos?.map(estilo => estilo.estilo) || [],  // Cambiado de nombre a estilo
    createdAt: cerveza.fecha_creacion,
    active: cerveza.activo,
    image: cerveza.imagen  // Agregar imagen
  };

  return mapped as Beer;
};

/**
 * Convierte un array de cervezas del backend al formato del frontend
 */
export const mapCervezasToFrontend = (cervezas: CervezaBackend[]): Beer[] => {
  return cervezas.map(mapCervezaToFrontend);
};

/**
 * Convierte un estilo de cerveza del backend al formato del frontend
 */
export const mapEstiloCervezaToFrontend = (estilo: TipoEstiloCervezaBackend): BeerStyle => {
  return {
    id: estilo.id,
    name: estilo.estilo,  // Cambiado de nombre a estilo
    description: estilo.descripcion,
    active: true,  // No hay campo activo en backend, usar true por defecto
    percentage: 0, // default value, adjust as needed
    color: '#000000' // default value, adjust as needed
  };
};

// ===== MAPPERS PARA EQUIPOS =====

/**
 * Convierte un equipo del backend al formato del frontend
 */
export const mapEquipoToFrontend = (equipo: EquipoBackend): Canilla => {
  const barrelCapacity = equipo.barril?.capacidad || 0;
  const currentVolume = Number((equipo as any).volumen_actual ?? 0);
  const allowsSales = Boolean(equipo.estado?.permite_ventas);
  const codigo = equipo.codigo_equipo || null;
  const nombreBase = equipo.nombre_equipo || `Canilla ${equipo.id}`;
  const nombreEquipo = codigo ? `${codigo} - ${nombreBase}` : nombreBase;
  const pvNombre = equipo.punto_venta?.nombre || 'Sin ubicación';
  const pvCodigo = equipo.punto_venta?.codigo_punto_venta || null;
  const ubicacion = pvCodigo ? `${pvCodigo} - ${pvNombre}` : pvNombre;
  
  return {
    id: equipo.id,
    name: nombreEquipo,
    location: ubicacion,
    status: allowsSales ? 'En Línea' : 'Fuera de Línea',
    currentBeer: equipo.cerveza_actual?.nombre || 'Sin cerveza',
    barrelLevel: Number((equipo as any).nivel_barril_porcentaje ?? 0),
    barrelCapacity: barrelCapacity,
    currentVolume: currentVolume,
    temperature: Number((equipo as any).temperatura_actual ?? 0),
    beerType: equipo.cerveza_actual?.estilos?.[0]?.estilo || 'Sin tipo',  // Cambiado de nombre a estilo
    currentBeerId: equipo.id_cerveza || undefined,
    barrelTypeId: equipo.id_barril,
    active: allowsSales
  };
};

/**
 * Convierte un array de equipos del backend al formato del frontend
 */
export const mapEquiposToFrontend = (equipos: EquipoBackend[]): Canilla[] => {
  return equipos.map(mapEquipoToFrontend);
};

/**
 * Convierte un tipo de barril del backend al formato del frontend
 */
export const mapTipoBarrilToFrontend = (tipoBarril: TipoBarrilBackend): BarrelType => {
  return {
    id: tipoBarril.id,
    name: tipoBarril.nombre || `Barril ${tipoBarril.capacidad}L`,
    capacity: tipoBarril.capacidad,
    description: `Capacidad: ${tipoBarril.capacidad} litros`,
    active: true // Asumimos que están activos si están en la respuesta
  };
};

/**
 * Convierte un estado de equipo del backend al formato del frontend
 */
export const mapEstadoEquipoToFrontend = (estado: TipoEstadoEquipoBackend): EquipmentState => {
  return {
    id: estado.id,
    name: estado.estado,
    description: `Permite ventas: ${estado.permite_ventas ? 'Sí' : 'No'}`,
    active: true // Asumimos que están activos si están en la respuesta
  };
};

// ===== FUNCIONES AUXILIARES =====

/**
 * Mapea el nombre del estado del equipo a un status del frontend
 */
export const mapEstadoEquipoToStatus = (estadoNombre?: string): 'En Línea' | 'Fuera de Línea' => {
  if (!estadoNombre) return 'Fuera de Línea';
  
  const estadoLower = estadoNombre.toLowerCase();
  
  if (estadoLower.includes('activo') || 
      estadoLower.includes('operativo') || 
      estadoLower.includes('funcionando') ||
      estadoLower.includes('en línea')) {
    return 'En Línea';
  }
  
  return 'Fuera de Línea';
};

/**
 * Calcula el porcentaje de nivel del barril
 */
export const calcularPorcentajeNivel = (capacidadActual: number, capacidadTotal: number): number => {
  if (capacidadTotal === 0) return 0;
  return Math.round((capacidadActual / capacidadTotal) * 100);
};

/**
 * Determina el estado del nivel del barril basado en el porcentaje
 */
export const determinarEstadoNivel = (porcentaje: number): 'alto' | 'medio' | 'bajo' | 'critico' => {
  if (porcentaje >= 70) return 'alto';
  if (porcentaje >= 40) return 'medio';
  if (porcentaje >= 20) return 'bajo';
  return 'critico';
};

/**
 * Calcula el volumen actual del barril
 */
export const calcularVolumenActual = (nivelPorcentaje: number, capacidadTotal: number): number => {
  return (nivelPorcentaje / 100) * capacidadTotal;
};

// ===== MAPPERS INVERSOS (FRONTEND → BACKEND) =====

/**
 * Convierte datos del formulario de cerveza al formato del backend
 */
export const mapBeerFormToBackend = (formData: any) => {
  return {
    nombre: formData.name,
    cerveceria: formData.brewery,
    descripcion: formData.description,
    abv: parseFloat(formData.abv),
    ibu: parseInt(formData.ibu),
    activo: true,
    estilos_ids: formData.styles || []
  };
};

/**
 * Convierte datos del formulario de equipo al formato del backend
 */
export const mapEquipmentFormToBackend = (formData: any) => {
  return {
    nombre: formData.name,
    ubicacion: formData.location,
    tipo_barril_id: formData.barrelTypeId,
    estado_id: formData.stateId,
    nivel_barril: formData.barrelLevel,
    temperatura: formData.temperature,
    activo: formData.active !== false
  };
};

// ===== UTILIDADES PARA ALERTAS =====

/**
 * Determina el color de la alerta basado en el tipo
 */
export const getAlertColor = (tipoAlerta: string): string => {
  switch (tipoAlerta.toLowerCase()) {
    case 'critico':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medio':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'bajo':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

/**
 * Determina el ícono de la alerta basado en el tipo
 */
export const getAlertIcon = (tipoAlerta: string): string => {
  switch (tipoAlerta.toLowerCase()) {
    case 'critico':
      return 'AlertTriangle';
    case 'medio':
      return 'AlertCircle';
    case 'bajo':
      return 'Info';
    default:
      return 'Bell';
  }
};

/**
 * Formatea el porcentaje para mostrar
 */
export const formatPercentage = (porcentaje: number): string => {
  return `${porcentaje.toFixed(1)}%`;
};

/**
 * Formatea el volumen para mostrar
 */
export const formatVolume = (volumen: number): string => {
  return `${volumen.toFixed(1)}L`;
};

/**
 * Formatea la temperatura para mostrar
 */
export const formatTemperature = (temperatura: number): string => {
  return `${temperatura.toFixed(1)}°C`;
};

/**
 * Formatea un precio en formato de moneda
 */
export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);
};
