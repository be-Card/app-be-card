import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, LogOut, User, Settings, AlertTriangle, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAlertas } from '../hooks/useAlertas';
import styles from './Header.module.scss';

const Header: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed, user, logout } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { alertasActivas: alertas, loading: loadingAlertas } = useAlertas();

  // Manejar clics fuera del menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/pricing':
        return 'Precios y Promociones';
      case '/reports':
        return 'Reportes';
      case '/clients':
        return 'Clientes';
      case '/profile':
        return 'Perfil';
      case '/beers':
        return 'Cervezas y Equipos';
      case '/settings':
        return 'Configuración';
      default:
        return 'Dashboard';
    }
  };

  const showSearchBar = location.pathname !== '/reports' && !location.pathname.startsWith('/clients');

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user?.nombres) return 'U';
    const names = user.nombres.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.nombres.substring(0, 2).toUpperCase();
  };

  const getUserRole = () => {
    if (!user?.roles || user.roles.length === 0) return 'Usuario';
    return user.roles[0].tipo_rol_usuario.nombre;
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button 
          className={styles.mobileMenuButton}
          onClick={() => { setSidebarCollapsed(!sidebarCollapsed); setShowUserMenu(false); }}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        
        {showSearchBar && (
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar clientes, productos..." 
              className={styles.searchInput}
            />
          </div>
        )}

        {!showSearchBar && (
          <h1 className="text-[22px] font-bold text-white font-inter ml-4">
            {getPageTitle()}
          </h1>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.notificationContainer} ref={notificationsRef}>
          <button
            className={styles.notificationButton}
            aria-label="Notificaciones"
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
          >
            <Bell size={20} />
            {alertas.length > 0 && (
              <span className={styles.notificationBadge}>{alertas.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className={styles.notificationsDropdown}>
              <div className={styles.notificationsHeader}>
                <h3>Notificaciones</h3>
                {alertas.length > 0 && (
                  <span className={styles.notificationCount}>{alertas.length}</span>
                )}
              </div>
              <div className={styles.notificationsDivider}></div>
              <div className={styles.notificationsList}>
                {loadingAlertas ? (
                  <div className={styles.notificationItem}>
                    <p className={styles.notificationText}>Cargando alertas...</p>
                  </div>
                ) : alertas.length === 0 ? (
                  <div className={styles.notificationItem}>
                    <p className={styles.notificationText}>No hay alertas</p>
                  </div>
                ) : (
                  alertas.map((alerta, index) => (
                    <div key={`${alerta.equipo_id}-${index}`} className={styles.notificationItem}>
                      <div className={styles.notificationIcon}>
                        <AlertTriangle size={18} className={styles.alertIcon} />
                      </div>
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationTitle}>
                          {alerta.nombre_equipo || 'Equipo desconocido'}
                        </p>
                        <p className={styles.notificationText}>
                          {alerta.tipo_alerta}: {alerta.mensaje}
                        </p>
                        {alerta.timestamp && (
                          <p className={styles.notificationTime}>
                            <Clock size={12} />
                            {new Date(alerta.timestamp).toLocaleString('es-AR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {alertas.length > 0 && (
                <>
                  <div className={styles.notificationsDivider}></div>
                  <button
                    className={styles.viewAllButton}
                    onClick={() => {
                      navigate('/beers');
                      setShowNotifications(false);
                    }}
                  >
                    Ver todos los equipos
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.userProfile} ref={userMenuRef}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.nombres || 'Usuario'}</span>
            <span className={styles.userRole}>{getUserRole()}</span>
          </div>
          <div 
            className={styles.userAvatar}
            onClick={(e) => {
              e.stopPropagation();
              setShowUserMenu(!showUserMenu);
            }}
          >
            <span className={styles.avatarText}>{getUserInitials()}</span>
          </div>

          {showUserMenu && (
            <div className={styles.userMenu}>
              <div className={styles.userMenuHeader}>
                <div className={styles.userMenuInfo}>
                  <span className={styles.userMenuName}>{user?.nombres || 'Usuario'}</span>
                  <span className={styles.userMenuEmail}>{user?.email || ''}</span>
                </div>
              </div>
              <div className={styles.userMenuDivider}></div>
              <button 
                className={styles.userMenuItem}
                onClick={() => {
                  navigate('/profile');
                  setShowUserMenu(false);
                }}
              >
                <User size={16} />
                <span>Perfil</span>
              </button>
              <button 
                className={styles.userMenuItem}
                onClick={() => {
                  navigate('/settings');
                  setShowUserMenu(false);
                }}
              >
                <Settings size={16} />
                <span>Configuración</span>
              </button>
              <div className={styles.userMenuDivider}></div>
              <button 
                className={`${styles.userMenuItem} ${styles.logoutItem}`}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
