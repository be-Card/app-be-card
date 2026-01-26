import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import authService from '../services/authService';
import { isSuperAdminUser } from '../utils/roles';
import { isAdminHost, isClientsHost, ADMIN_APP_URL } from '../utils/subdomains';

const AuthRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated, setIsInitialized } = useStore();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processTokens = async () => {
      try {
        // Extraer tokens del hash de la URL
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = params.get('access_token') ?? '';
        const refreshToken = params.get('refresh_token') ?? '';

        // Si no hay token, redirigir al login
        if (!accessToken) {
          navigate('/login', { replace: true });
          return;
        }

        // Guardar tokens en localStorage
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        // Limpiar la URL (remover tokens del hash)
        window.history.replaceState(null, '', window.location.pathname);

        // Obtener información del usuario para determinar a dónde redirigir
        const user = await authService.getCurrentUser();

        if (!user) {
          // Token inválido, limpiar y redirigir al login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/login', { replace: true });
          return;
        }

        // Actualizar el store con el usuario autenticado
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        setIsInitialized(true);

        // Determinar destino basado en el rol y el host actual
        const isSuperAdmin = isSuperAdminUser(user);
        const adminHost = isAdminHost();
        const clientsHost = isClientsHost();

        if (isSuperAdmin) {
          if (adminHost) {
            // Ya estamos en admin, ir al panel de admin
            navigate('/admin', { replace: true });
          } else if (clientsHost) {
            // Estamos en clientes pero somos superadmin, redirigir a admin
            const hash = new URLSearchParams();
            hash.set('access_token', accessToken);
            if (refreshToken) {
              hash.set('refresh_token', refreshToken);
            }
            window.location.replace(`${ADMIN_APP_URL}/auth-redirect#${hash.toString()}`);
          } else {
            // Desarrollo local u otro host
            navigate('/admin', { replace: true });
          }
        } else {
          // Usuario normal, ir al dashboard
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error procesando autenticación:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login', { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    processTokens();
  }, [navigate, setUser, setIsAuthenticated, setIsInitialized]);

  // Mostrar un indicador de carga mientras se procesan los tokens
  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Procesando autenticación...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthRedirect;

