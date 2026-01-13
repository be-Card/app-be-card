import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  field?: string;
}

/**
 * Extrae un mensaje de error user-friendly desde diferentes formatos de error
 */
export const extractErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'Ocurrió un error inesperado';
  }

  // Error de Axios (API)
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    // Error de respuesta del servidor
    if (axiosError.response) {
      const { status, data } = axiosError.response;

      // FastAPI devuelve errores en formato {detail: string} o {detail: [{msg, type, loc}]}
      if (data?.detail) {
        // Si detail es un array (errores de validación de Pydantic)
        if (Array.isArray(data.detail)) {
          return data.detail
            .map((err: any) => {
              const field = err.loc?.[err.loc.length - 1] || '';
              return field ? `${field}: ${err.msg}` : err.msg;
            })
            .join(', ');
        }

        // Si detail es un string
        if (typeof data.detail === 'string') {
          return data.detail;
        }
      }

      // Mensajes genéricos por código de estado
      switch (status) {
        case 400:
          return data?.message || 'Solicitud inválida. Verifica los datos ingresados.';
        case 401:
          return 'Sesión expirada. Por favor inicia sesión nuevamente.';
        case 403:
          return 'No tienes permisos para realizar esta acción.';
        case 404:
          return 'Recurso no encontrado.';
        case 409:
          return data?.message || 'El recurso ya existe o hay un conflicto.';
        case 422:
          return 'Los datos ingresados no son válidos.';
        case 500:
          return 'Error interno del servidor. Por favor intenta más tarde.';
        case 503:
          return 'Servicio no disponible. Por favor intenta más tarde.';
        default:
          return data?.message || `Error del servidor (${status})`;
      }
    }

    // Error de petición (no hay respuesta del servidor)
    if (axiosError.request) {
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return 'La solicitud tardó demasiado. Verifica tu conexión a internet.';
      }
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }

    // Error al configurar la petición
    return 'Error al procesar la solicitud. Por favor intenta nuevamente.';
  }

  // Error estándar de JavaScript
  if (error instanceof Error) {
    return error.message;
  }

  // Error como string
  if (typeof error === 'string') {
    return error;
  }

  // Objeto con mensaje
  if (typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }

  return 'Ocurrió un error inesperado';
};

/**
 * Type guard para verificar si un error es de Axios
 */
export const isAxiosError = (error: unknown): error is AxiosError => {
  return (error as AxiosError).isAxiosError === true;
};

/**
 * Extrae información detallada del error para logging/debugging
 */
export const getErrorDetails = (error: unknown): ApiError => {
  const message = extractErrorMessage(error);

  if (isAxiosError(error)) {
    return {
      message,
      status: error.response?.status,
      field: (error.response?.data as any)?.field,
    };
  }

  return { message };
};

/**
 * Maneja errores de forma consistente mostrando mensajes al usuario
 * Usa esta función en los catch de servicios/componentes
 *
 * @param error Error capturado
 * @param fallbackMessage Mensaje alternativo si no se puede extraer uno
 * @returns Mensaje de error user-friendly
 */
export const handleApiError = (
  error: unknown,
  fallbackMessage: string = 'Ocurrió un error inesperado'
): string => {
  const message = extractErrorMessage(error);

  return message || fallbackMessage;
};
