export interface ClientSummary {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  loyaltyLevel: string;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  balance: number;
  joinDate: string;
  lastOrder?: string | null;
}

export interface ClientDetail {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  age?: number | null;
  status: string;
  joinDate: string;
  lastLogin?: string | null;
  verified: boolean;
}

export interface ClientStats {
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  favoriteStyle?: string | null;
  totalRedemptions: number;
  pointsRedeemed: number;
  availableBalance: number;
  balanceUpdatedAt?: string | null;
}

export interface ClientLoyalty {
  currentPoints: number;
  level: string;
  levelBenefits?: string | null;
  progressToNext: number;
  pointsToNextLevel?: number | null;
}

export interface Order {
  id: string;
  date: string;
  amount: number;
  quantity: number;
  beerName: string;
  beerType: string;
  paymentMethod?: string | null;
}

export interface PaymentMethod {
  id: number;
  method: string;
  provider?: string | null;
  active: boolean;
  createdAt: string;
  lastUsed?: string | null;
}

export interface PointTransaction {
  id: string;
  type: string;
  points: number;
  description: string;
  date: string;
  relatedOrderId?: string | null;
  relatedRedemptionId?: string | null;
}

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: string;
  loyaltyLevel: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  balance?: number;
  joinDate: string;
  lastOrder?: string | null;
  favoriteStyle?: string | null;
  age?: number | null;
  gender?: string | null;
  birthDate?: string | null;
  verified?: boolean;
  lastLogin?: string | null;
}

export interface KPI {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: string;
}

export interface SalesData {
  date: string;
  sales: number;
  volume: number;
}

export interface BeerStyle {
  name: string;
  percentage: number;
  color: string;
  [key: string]: any; // Para compatibilidad con Recharts
}

export interface TapStatus {
  id: string;
  name: string;
  status: 'Activo' | 'Mantenimiento' | 'Inactivo';
  beerType: string;
  temperature: number;
  pressure: number;
  volume: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  active?: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
}

// Nuevos tipos para recompensas
export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  status: 'available' | 'redeemed' | 'expired';
  redeemedDate?: string;
  category: 'discount' | 'free_beer' | 'merchandise' | 'experience';
}

export interface LoyaltyProgram {
  currentPoints: number;
  level: string;
  nextLevelPoints?: number;
  totalEarned: number;
  totalRedeemed: number;
}

export interface EditClientFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gender?: string;
  birthDate?: string;
}

export interface ClientListResponse {
  clients: ClientSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    loyaltyLevels: string[];
    statusOptions: string[];
  };
}

export interface ClientDetailResponse {
  client: ClientDetail;
  stats: ClientStats;
  loyalty: ClientLoyalty;
  recentOrders: Order[];
  paymentMethods: PaymentMethod[];
}

export interface ClientStatsResponse {
  stats: ClientStats;
  loyalty: ClientLoyalty;
}

export interface ClientLoyaltyResponse {
  transactions: PointTransaction[];
  summary: ClientLoyalty;
}

export interface ClientRewardsItem {
  id: number;
  name: string;
  pointsCost: number;
  status: string;
  redeemedDate?: string | null;
  category?: string | null;
}

export interface ClientRewardsResponse {
  currentPoints: number;
  level: string;
  available: ClientRewardsItem[];
  history: ClientRewardsItem[];
}

export interface ClientOrdersResponse {
  orders: Order[];
}

export interface ClientPaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
}

export interface LoyaltyHistoryResponse {
  transactions: PointTransaction[];
  summary: ClientLoyalty;
}

// ===== TIPOS PARA CERVEZAS Y EQUIPOS =====

// Tipos de backend (respuestas de la API)
export interface TipoEstiloCervezaBackend {
  id: number;
  id_ext: string;
  estilo: string;  // Cambiado de nombre a estilo para coincidir con backend
  descripcion?: string;
  origen?: string;
}

export interface CervezaBackend {
  id: number;
  nombre: string;
  proveedor: string;  // Cambiado de cerveceria a proveedor para coincidir con backend
  tipo: string;
  descripcion?: string;
  abv: number;
  ibu: number;
  activo: boolean;
  imagen?: string;
  fecha_creacion: string;
  estilos: TipoEstiloCervezaBackend[];
  precio_actual?: number;
  stock_total?: number;
  stock_base?: number;
}

export interface PrecioCervezaBackend {
  id: number;
  cerveza_id: number;
  precio: number;
  fecha_inicio: string;
  fecha_fin?: string;
  activo: boolean;
}

export interface TipoBarrilBackend {
  id: number;
  id_ext: string;
  capacidad: number;
  nombre: string | null;
}

export interface TipoEstadoEquipoBackend {
  id: number;
  id_ext: string;
  estado: string;
  permite_ventas: boolean;
}

export interface EquipoBackend {
  id: number;
  id_ext: string;
  creado_el: string;
  nombre_equipo: string | null;
  id_barril: number;
  capacidad_actual: number;
  temperatura_actual: number | string | null;
  ultima_limpieza?: string | null;
  proxima_limpieza?: string | null;
  id_estado_equipo: number;
  id_punto_de_venta?: number | null;
  id_cerveza?: number | null;
  estado: TipoEstadoEquipoBackend;
  barril: TipoBarrilBackend;
  punto_venta?: {
    id: number;
    id_ext: string;
    nombre: string;
  } | null;
  cerveza_actual?: CervezaBackend | null;
  nivel_barril_porcentaje: number;
  volumen_actual: number;
}

export interface PuntoVentaListItem {
  id: number;
  id_ext: string;
  nombre: string;
}

// Tipos de frontend (para componentes)
export interface Beer {
  id: number;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  ibu: number;
  pricePerLiter: number;
  stock: number;
  stockBase?: number;
  status: 'Activa' | 'Inactiva';
  description?: string;
  styles?: string[];
  createdAt?: string;
  active: boolean;
  image?: string;  // URL o base64 de la imagen
}

export interface Canilla {
  id: number;
  name: string;
  location: string;
  status: 'En Línea' | 'Fuera de Línea';
  currentBeer: string;
  barrelLevel: number;
  barrelCapacity: number;
  currentVolume: number;
  temperature: number;
  beerType?: string;
  currentBeerId?: number;
  barrelTypeId?: number;
  active: boolean;
}

export interface BeerStyle {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

export interface BarrelType {
  id: number;
  name: string;
  capacity: number;
  description?: string;
  active: boolean;
}

export interface EquipmentState {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

// Tipos para formularios
export interface BeerFormData {
  name: string;
  brewery: string;
  style: string;
  country: string;
  abv: string;
  ibu: string;
  pricePerLiter: string;
  stock: string;
  photo: File | null;
  description?: string;
  styles?: number[];
}

export interface CreateBeerRequest {
  nombre: string;
  proveedor: string;  // Cambiado de cerveceria a proveedor
  tipo: string;
  descripcion?: string;
  abv: number;
  ibu: number;
  activo: boolean;  // Cambiado de activa a activo
  estilos_ids: number[];
  imagen?: string;  // URL o base64 de la imagen
  precio_inicial?: number;
  stock_base?: number;
}

export type UpdateBeerRequest = Partial<CreateBeerRequest> & {
  precio_nuevo?: number;
  motivo_precio?: string;
};

export interface CreateBeerPriceRequest {
  cerveza_id: number;
  precio: number;
  fecha_inicio: string;
}

export interface CreateEquipmentRequest {
  nombre_equipo?: string | null;
  id_barril: number;
  capacidad_actual: number;
  temperatura_actual?: number | null;
  ultima_limpieza?: string | null;
  proxima_limpieza?: string | null;
  id_estado_equipo: number;
  id_punto_de_venta?: number | null;
  id_cerveza?: number | null;
}

export type UpdateEquipmentRequest = Partial<CreateEquipmentRequest>;

export interface ChangeBeerRequest {
  id_cerveza: number;
  capacidad_nueva: number;
  id_barril?: number;
  motivo: string;
}

// Tipos para respuestas de API de cervezas y equipos
export interface BeersListResponse {
  cervezas: CervezaBackend[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface BeerDetailResponse {
  cerveza: CervezaBackend;
  precios: PrecioCervezaBackend[];
}

export interface EquipmentListResponse {
  equipos: EquipoBackend[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface EquipmentDetailResponse {
  equipo: EquipoBackend;
}

// El backend devuelve directamente arrays, no objetos wrapper
export type BeerStylesResponse = TipoEstiloCervezaBackend[];

export type BarrelTypesResponse = TipoBarrilBackend[];

export type EquipmentStatesResponse = TipoEstadoEquipoBackend[];

export interface LowStockEquipmentResponse {
  equipos_bajo_stock: EquipoBackend[];
  threshold: number;
}

// Tipos para filtros
export interface BeerFilters {
  nombre?: string;
  search?: string;
  cerveceria?: string;
  estilo_id?: number;
  activo?: boolean;
  destacado?: boolean;
  order_dir?: 'asc' | 'desc';
  precio_min?: number;
  precio_max?: number;
}

export interface EquipmentFilters {
  nombre?: string;
  search?: string;
  ubicacion?: string;
  estado_id?: number;
  activo?: boolean;
  permite_ventas?: boolean;
  order_dir?: 'asc' | 'desc';
  nivel_min?: number;
  nivel_max?: number;
}

// ===== TIPOS PARA PRICING Y PROMOCIONES =====

// Prioridad de reglas de precio según backend
export type TipoPrioridadRegla = 'baja' | 'media' | 'alta';

// Regla de precio (lectura) según backend
export interface ReglaDePrecioBackend {
  id: number;
  id_ext: string;
  nombre: string;
  descripcion?: string | null;
  precio?: number | string | null;
  esta_activo: boolean;
  prioridad: TipoPrioridadRegla;
  multiplicador: number | string;
  fecha_hora_inicio: string;
  fecha_hora_fin?: string | null;
  dias_semana?: string | null; // JSON array de días ['lunes', 'martes', ...]
  creado_por: number;
  creado_el: string;
  vigente: boolean;
  estado: 'Activa' | 'Programada' | 'Inactiva';
  alcance: string;
  alcances?: Array<{
    tipo_alcance: 'cerveza' | 'punto_de_venta' | 'equipo';
    id_entidad: number;
    nombre?: string | null;
  }>;
}

// Respuesta paginada de reglas
export interface ReglaListResponse {
  reglas: ReglaDePrecioBackend[];
  total: number;
  page: number;
  per_page: number;
}

// Crear regla de precio
export interface ReglaDePrecioCreateRequest {
  nombre: string;
  descripcion?: string | null;
  precio?: number | string | null;
  esta_activo: boolean;
  prioridad?: TipoPrioridadRegla;
  multiplicador: number | string;
  fecha_hora_inicio: string; // ISO
  fecha_hora_fin?: string | null; // ISO
  dias_semana?: string | null; // JSON string
  cervezas_ids?: number[] | null;
  puntos_venta_ids?: number[] | null;
  equipos_ids?: number[] | null;
}

// Actualizar regla de precio
export interface ReglaDePrecioUpdateRequest {
  nombre?: string;
  descripcion?: string | null;
  precio?: number | string | null;
  esta_activo?: boolean;
  prioridad?: TipoPrioridadRegla;
  multiplicador?: number | string;
  fecha_hora_inicio?: string; // ISO
  fecha_hora_fin?: string | null; // ISO
  dias_semana?: string | null; // JSON string
  cervezas_ids?: number[] | null;
  puntos_venta_ids?: number[] | null;
  equipos_ids?: number[] | null;
}

// Consulta de precio
export interface ConsultaPrecioRequest {
  id_cerveza: number;
  id_equipo?: number;
  id_punto_venta?: number;
  fecha_consulta?: string; // ISO
  cantidad: number;
}

// Resultado de cálculo de precio
export interface CalculoPrecioResponse {
  precio_base: number | string;
  precio_final: number | string;
  reglas_aplicadas: string[];
  multiplicador_total: number | string;
  descuento_aplicado?: number | string | null;
}
