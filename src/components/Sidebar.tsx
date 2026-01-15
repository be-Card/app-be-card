import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Beer, 
  FileText, 
  DollarSign, 
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Shield
} from 'lucide-react';
import { useStore } from '../store/useStore';
import styles from './Sidebar.module.scss';
import { isSuperAdminUser } from '../utils/roles';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'clients', label: 'Clientes', icon: Users, path: '/clients' },
  { id: 'beers', label: 'Cervezas y Equipos', icon: Beer, path: '/beers' },
  { id: 'reports', label: 'Reportes', icon: FileText, path: '/reports' },
  { id: 'pricing', label: 'Precios y Promociones', icon: DollarSign, path: '/pricing' },
  { id: 'profile', label: 'Mi Perfil', icon: User, path: '/profile' },
  { id: 'settings', label: 'Configuración', icon: Settings, path: '/settings' },
  { id: 'admin', label: 'Admin', icon: Shield, path: '/admin' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed, user } = useStore() as any;
  const isSuperAdmin = isSuperAdminUser(user);

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <img 
            src="/images/mgpt85r7-rvnse0q.png" 
            alt="BeCard Logo" 
            className={styles.logoImage}
          />
        </div>
        <button 
          className={styles.toggleButton}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className={styles.navigation}>
        <ul className={styles.navList}>
          {navigationItems
            .filter((item) => {
              if (isSuperAdmin) return item.id === 'admin';
              return item.id !== 'admin';
            })
            .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.id} className={styles.navItem}>
                <Link 
                  to={item.path}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={20} className={styles.navIcon} />
                  {!sidebarCollapsed && (
                    <span className={styles.navLabel}>{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.systemStatus}>
          <div className={styles.statusIndicator}>
            <div className={styles.statusDot}></div>
            {!sidebarCollapsed && (
              <span className={styles.statusText}>Sistema Operativo</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
