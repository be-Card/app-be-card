import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tenantService, { Tenant } from '../services/tenantService';
import { useStore } from '../store/useStore';
import { isSuperAdminUser } from '../utils/roles';
import styles from './SelectTenant.module.scss';

const SelectTenant: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useStore() as any;
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = isSuperAdminUser(user);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await tenantService.getMyTenants();
        setTenants(result);
        if (result.length === 1) {
          localStorage.setItem('tenant_slug', result[0].slug);
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e: any) {
        setError('No se pudieron cargar los establecimientos');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isLoading, isAdmin, navigate]);

  const handleSelect = (tenant: Tenant) => {
    localStorage.setItem('tenant_slug', tenant.slug);
    navigate('/dashboard', { replace: true });
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await tenantService.getMyTenants();
      setTenants(result);
      if (result.length === 1) {
        localStorage.setItem('tenant_slug', result[0].slug);
        navigate('/dashboard', { replace: true });
      }
    } catch (e: any) {
      setError('No se pudieron cargar los establecimientos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (isAdmin) return null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <img src="/images/mgpt85r7-rvnse0q.png" className={styles.logo} alt="BeCard" />
          </div>
        </div>

        <h1 className={styles.title}>Seleccionar establecimiento</h1>
        <p className={styles.subtitle}>Elegí el establecimiento con el que querés trabajar.</p>

        <div className={styles.content}>
          {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}

          <div className={styles.list}>
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                className={styles.tenantButton}
                type="button"
              >
                <p className={styles.tenantName}>{t.nombre}</p>
                <div className={styles.tenantMeta}>{t.slug}</div>
              </button>
            ))}
          </div>

          {tenants.length === 0 && !error && (
            <>
              <div className={`${styles.alert} ${styles.alertWarn}`}>
                <div className={styles.alertTitle}>Acceso habilitado, sin establecimiento asignado</div>
                <div className={styles.alertBody}>
                  Tu cuenta está habilitada, pero todavía no está asociada a ningún establecimiento.
                  {user?.email ? (
                    <>
                      {' '}
                      Email: <span className={styles.mono}>{String(user.email)}</span>
                    </>
                  ) : null}
                </div>
                <div className={styles.alertBody}>
                  Pedile al equipo de administración que te asigne a un establecimiento (o que cree uno nuevo) y volvé a intentar.
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.primaryButton} onClick={handleRefresh}>
                  Actualizar
                </button>
                <button type="button" className={styles.secondaryButton} onClick={logout}>
                  Cerrar sesión
                </button>
              </div>
              <div className={styles.helpText}>
                Si necesitás ayuda, contactá a soporte indicando tu email y el nombre del cliente.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectTenant;
