import { KPI, SalesData, BeerStyle, TapStatus } from '../types';

// NOTA: mockClients eliminado - ahora se usan datos reales del backend

export const mockKPIs: KPI[] = [
  {
    id: '1',
    title: 'Ingresos del Día',
    value: '$45,230',
    change: 12.5,
    changeType: 'increase',
    icon: 'dollar-sign',
  },
  {
    id: '2',
    title: 'Litros Servidos',
    value: '1,247L',
    change: 8.2,
    changeType: 'increase',
    icon: 'beer',
  },
  {
    id: '3',
    title: 'Clientes Únicos',
    value: '156',
    change: -3.1,
    changeType: 'decrease',
    icon: 'users',
  },
  {
    id: '4',
    title: 'Consumo Promedio',
    value: '$290',
    change: 5.7,
    changeType: 'increase',
    icon: 'trending-up',
  },
];

export const mockSalesData: SalesData[] = [
  { date: '2024-01-08', sales: 32500, volume: 890 },
  { date: '2024-01-09', sales: 28900, volume: 756 },
  { date: '2024-01-10', sales: 41200, volume: 1120 },
  { date: '2024-01-11', sales: 38750, volume: 1045 },
  { date: '2024-01-12', sales: 44300, volume: 1189 },
  { date: '2024-01-13', sales: 39800, volume: 1078 },
  { date: '2024-01-14', sales: 45230, volume: 1247 },
];

export const mockBeerStyles: BeerStyle[] = [
  { id: 1, active: true, name: 'IPA', percentage: 35, color: '#FF6B35' },
  { id: 2, active: true, name: 'Lager', percentage: 28, color: '#F7931E' },
  { id: 3, active: true, name: 'Stout', percentage: 18, color: '#8B4513' },
  { id: 4, active: true, name: 'Wheat', percentage: 12, color: '#FFD700' },
  { id: 5, active: true, name: 'Pilsner', percentage: 7, color: '#32CD32' },
];

export const mockTapStatus: TapStatus[] = [
  {
    id: '1',
    name: 'Canilla 1',
    status: 'Activo',
    beerType: 'IPA Americana',
    temperature: 4.2,
    pressure: 12.5,
    volume: 85,
  },
  {
    id: '2',
    name: 'Canilla 2',
    status: 'Activo',
    beerType: 'Lager Premium',
    temperature: 3.8,
    pressure: 11.8,
    volume: 92,
  },
  {
    id: '3',
    name: 'Canilla 3',
    status: 'Mantenimiento',
    beerType: 'Stout Imperial',
    temperature: 5.1,
    pressure: 0,
    volume: 0,
  },
  {
    id: '4',
    name: 'Canilla 4',
    status: 'Activo',
    beerType: 'Wheat Beer',
    temperature: 4.5,
    pressure: 12.2,
    volume: 67,
  },
];
