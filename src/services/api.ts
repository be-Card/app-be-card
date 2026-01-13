import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Configuración base de la API
const viteApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : viteApiBaseUrl
    ? `${viteApiBaseUrl}/api/v1`
    : '/api/v1';

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable para evitar múltiples redirects
let isRedirecting = false;
let refreshPromise: Promise<string> | null = null;

const fetchNewAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post<{ access_token: string; refresh_token?: string }>(
    `${API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  localStorage.setItem('access_token', response.data.access_token);
  if (response.data.refresh_token) {
    localStorage.setItem('refresh_token', response.data.refresh_token);
  }

  return response.data.access_token;
};

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Evitar redirección automática en 401 durante el intento de login
    const url = (error.config?.url || '').toString();
    const isLoginEndpoint = url.includes('/auth/login-json') || url.includes('/auth/login');
    const isRefreshEndpoint = url.includes('/auth/refresh');
    const isOnLoginPage = typeof window !== 'undefined' && window.location?.pathname === '/login';

    const originalRequest = error.config as any;

    if (
      error.response?.status === 401 &&
      !isRedirecting &&
      !isLoginEndpoint &&
      !isRefreshEndpoint &&
      !isOnLoginPage &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = fetchNewAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRedirecting = true;

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        setTimeout(() => {
          import('../store/useStore').then(({ useStore }) => {
            const store = useStore.getState();
            store.logout();

            try {
              window.location.href = '/login';
            } catch {}

            isRedirecting = false;
          });
        }, 100);

        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
