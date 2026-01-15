import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getRoleNames, isSuperAdminUser } from '../utils/roles';
import { isAdminHost, isClientsHost, redirectToClients, redirectSuperadminToAdminWithTokens } from '../utils/subdomains';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireTenant?: boolean;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireTenant = true,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, isInitialized, user } = useStore() as any;
  const location = useLocation();

  // Mostrar loading mientras se inicializa la autenticación
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const adminHost = isAdminHost();
  const clientsHost = isClientsHost();
  const isAuthRedirectRoute = location.pathname === '/auth-redirect';
  const isLogoutRoute = location.pathname === '/logout';

  if (adminHost) {
    if (isAuthRedirectRoute || isLogoutRoute) {
      return <>{children}</>;
    }
    if (!isAuthenticated) {
      redirectToClients('/login');
      return null;
    }
    if (!isSuperAdminUser(user)) {
      redirectToClients('/');
      return null;
    }
  }

  // Para rutas públicas (login, register)
  if (!requireAuth) {
    if (isLogoutRoute) {
      return <>{children}</>;
    }
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      if (clientsHost && isSuperAdminUser(user)) {
        redirectSuperadminToAdminWithTokens();
        return null;
      }
      return <Navigate to={isSuperAdminUser(user) ? "/admin" : "/dashboard"} replace />;
    }
    // Si no está autenticado, mostrar la página pública
    return <>{children}</>;
  }

  // Para rutas protegidas - redirigir al login si no está autenticado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAuth && isAuthenticated && isSuperAdminUser(user)) {
    if (clientsHost) {
      redirectSuperadminToAdminWithTokens();
      return null;
    }
    const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
    if (!isAdminRoute) {
      return <Navigate to="/admin" replace />;
    }
  }

  if (requireAuth && isAuthenticated && allowedRoles && allowedRoles.length > 0) {
    const roleNames = getRoleNames(user);
    const allow = allowedRoles.some((r) => roleNames.includes(r.toLowerCase()));
    if (!allow) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requireAuth && isAuthenticated) {
    if (requireTenant) {
      const tenantSlug = localStorage.getItem('tenant_slug');
      const isTenantSelectionRoute = location.pathname === '/select-tenant';
      if (!tenantSlug && !isTenantSelectionRoute) {
        return <Navigate to="/select-tenant" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
