import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = true }) => {
  const { isAuthenticated, isLoading, isInitialized } = useStore();

  // Mostrar loading mientras se inicializa la autenticación
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Para rutas públicas (login, register)
  if (!requireAuth) {
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    // Si no está autenticado, mostrar la página pública
    return <>{children}</>;
  }

  // Para rutas protegidas - redirigir al login si no está autenticado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
