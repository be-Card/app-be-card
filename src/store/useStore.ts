import { create } from 'zustand';
import { Client, KPI, SalesData, BeerStyle, TapStatus } from '../types';
import { User } from '../services/authService';
import authService from '../services/authService';

interface AppState {
  // Navigation
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setIsInitialized: (isInitialized: boolean) => void;

  // Client data
  clients: Client[];
  setClients: (clients: Client[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedFilter: string | null;
  setSelectedFilter: (filter: string | null) => void;

  // Dashboard data
  kpis: KPI[];
  salesData: SalesData[];
  beerStyles: BeerStyle[];
  tapStatus: TapStatus[];
  setKpis: (kpis: KPI[]) => void;
  setSalesData: (data: SalesData[]) => void;
  setBeerStyles: (styles: BeerStyle[]) => void;
  setTapStatus: (status: TapStatus[]) => void;

  // UI state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Actions
  logout: () => void;
  initializeAuth: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
}

export const useStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  // Authentication
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),

  // Client data
  clients: [],
  setClients: (clients) => set({ clients }),
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  selectedFilter: null,
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),

  // Dashboard data
  kpis: [],
  salesData: [],
  beerStyles: [],
  tapStatus: [],
  setKpis: (kpis) => set({ kpis }),
  setSalesData: (data) => set({ salesData: data }),
  setBeerStyles: (styles) => set({ beerStyles: styles }),
  setTapStatus: (status) => set({ tapStatus: status }),

  // UI state
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Actions
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      isInitialized: true
    });
  },

  initializeAuth: async () => {
    const state = get();
    
    if (state.isInitialized || state.isLoading) {
      return; // Evitar múltiples inicializaciones
    }

    set({ isLoading: true });

    try {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        // Verificar token con el servidor
        const user = await authService.getCurrentUser();
        
        if (user) {
          set({
            user,
            isAuthenticated: true,
            error: null,
            isLoading: false,
            isInitialized: true
          });
        } else {
          // Token inválido, limpiar
          get().logout();
        }
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true
        });
      }
    } catch {
      set({
        error: 'Error de autenticación',
        isLoading: false,
        isInitialized: true
      });
      get().logout();
    }
  },

  getCurrentUser: async () => {
    const state = get();
    
    // Si ya tenemos un usuario y está autenticado, devolverlo
    if (state.user && state.isAuthenticated) {
      return state.user;
    }

    // Si no está inicializado, inicializar primero
    if (!state.isInitialized) {
      await get().initializeAuth();
      return get().user;
    }

    return null;
  }
}));
