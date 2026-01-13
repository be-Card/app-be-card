import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from '../store/useStore';
import styles from './Layout.module.scss';

const Layout: React.FC = () => {
  const { sidebarCollapsed } = useStore();

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={`${styles.main} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <Header />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;