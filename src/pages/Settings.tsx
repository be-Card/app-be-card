import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Monitor, Smartphone } from 'lucide-react';
import styles from './Settings.module.scss';
import settingsService, { UserPreferences as ApiUserPreferences } from '../services/settingsService';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}

const Settings: React.FC = () => {
  const [preferences, setPreferences] = useState<ApiUserPreferences | null>(null);
  const [sessions, setSessions] = useState<
    Array<{ id: string; device: string; location: string; last_active: string; current: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
  });

  const languageOptions = useMemo(() => {
    return [
      { value: 'es', label: 'Español' },
      { value: 'en', label: 'English' },
      { value: 'pt', label: 'Português' },
    ];
  }, []);

  const themeOptions = useMemo(() => {
    return [
      { value: 'dark', label: 'Oscuro' },
      { value: 'light', label: 'Claro' },
      { value: 'system', label: 'Automático' },
    ];
  }, []);

  const dateFormatOptions = useMemo(() => {
    return [
      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    ];
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prefsRes, sessionsRes] = await Promise.all([
        settingsService.getPreferences(),
        settingsService.getActiveSessions(),
      ]);
      setPreferences(prefsRes.preferences);
      setSessions(sessionsRes.sessions);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const persistPreferences = async (next: ApiUserPreferences) => {
    setSavingPreferences(true);
    setError(null);
    try {
      const res = await settingsService.updatePreferences(next);
      setPreferences(res.preferences);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudieron guardar las preferencias');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdatePassword = async () => {
    setPasswordStatus(null);
    setError(null);
    try {
      const res = await settingsService.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setPasswordStatus(res.message || 'Contraseña actualizada exitosamente');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo actualizar la contraseña');
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    setError(null);
    try {
      await settingsService.closeSession(sessionId);
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo cerrar la sesión');
    }
  };

  return (
    <div className={styles.settings}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuración</h1>
      </div>

      <div className={styles.content}>
        {loading && <div className={styles.sectionDescription}>Cargando configuración...</div>}
        {error && <div className={styles.sectionDescription}>{error}</div>}
        {/* Configuración Regional */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Configuración Regional</h2>
          <div className={styles.regionalSettings}>
            <div className={styles.dropdown}>
              <label className={styles.label}>
                Idioma del Sistema <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <select 
                  value={preferences?.language || ''}
                  onChange={(e) => {
                    if (!preferences) return;
                    persistPreferences({ ...preferences, language: e.target.value });
                  }}
                  className={styles.select}
                  disabled={!preferences || savingPreferences}
                >
                  {languageOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={styles.selectIcon} size={15} />
              </div>
            </div>
            <div className={styles.dropdown}>
              <label className={styles.label}>
                Formato de Fecha <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <select 
                  value={preferences?.date_format || ''}
                  onChange={(e) => {
                    if (!preferences) return;
                    persistPreferences({ ...preferences, date_format: e.target.value });
                  }}
                  className={styles.select}
                  disabled={!preferences || savingPreferences}
                >
                  {dateFormatOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={styles.selectIcon} size={15} />
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider}></div>

        {/* Preferencias de Notificaciones */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Preferencias de Notificaciones</h2>
            <p className={styles.sectionDescription}>
              Controla cómo y cuándo recibes notificaciones
            </p>
          </div>
          
          <div className={styles.notificationsList}>
            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <h3 className={styles.notificationTitle}>Notificaciones por Email - Ventas</h3>
                <p className={styles.notificationDescription}>
                  Recibe reportes diarios de ventas por correo
                </p>
              </div>
              <div 
                className={`${styles.toggle} ${preferences?.notifications_email_sales ? styles.active : ''}`}
                onClick={() => {
                  if (!preferences || savingPreferences) return;
                  persistPreferences({
                    ...preferences,
                    notifications_email_sales: !preferences.notifications_email_sales,
                  });
                }}
              >
                <div className={styles.toggleSlider}></div>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <h3 className={styles.notificationTitle}>Notificaciones por Email - Inventario</h3>
                <p className={styles.notificationDescription}>
                  Alertas cuando el stock esté bajo
                </p>
              </div>
              <div 
                className={`${styles.toggle} ${preferences?.notifications_email_inventory ? styles.active : ''}`}
                onClick={() => {
                  if (!preferences || savingPreferences) return;
                  persistPreferences({
                    ...preferences,
                    notifications_email_inventory: !preferences.notifications_email_inventory,
                  });
                }}
              >
                <div className={styles.toggleSlider}></div>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <h3 className={styles.notificationTitle}>Notificaciones por Email - Clientes</h3>
                <p className={styles.notificationDescription}>
                  Avisos sobre nuevos clientes y actividad
                </p>
              </div>
              <div 
                className={`${styles.toggle} ${preferences?.notifications_email_clients ? styles.active : ''}`}
                onClick={() => {
                  if (!preferences || savingPreferences) return;
                  persistPreferences({
                    ...preferences,
                    notifications_email_clients: !preferences.notifications_email_clients,
                  });
                }}
              >
                <div className={styles.toggleSlider}></div>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <h3 className={styles.notificationTitle}>Notificaciones Push - Alertas Críticas</h3>
                <p className={styles.notificationDescription}>
                  Alertas importantes en tiempo real
                </p>
              </div>
              <div 
                className={`${styles.toggle} ${preferences?.notifications_push_critical ? styles.active : ''}`}
                onClick={() => {
                  if (!preferences || savingPreferences) return;
                  persistPreferences({
                    ...preferences,
                    notifications_push_critical: !preferences.notifications_push_critical,
                  });
                }}
              >
                <div className={styles.toggleSlider}></div>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <h3 className={styles.notificationTitle}>Notificaciones Push - Reportes</h3>
                <p className={styles.notificationDescription}>
                  Resúmenes periódicos de rendimiento
                </p>
              </div>
              <div 
                className={`${styles.toggle} ${preferences?.notifications_push_reports ? styles.active : ''}`}
                onClick={() => {
                  if (!preferences || savingPreferences) return;
                  persistPreferences({
                    ...preferences,
                    notifications_push_reports: !preferences.notifications_push_reports,
                  });
                }}
              >
                <div className={styles.toggleSlider}></div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider}></div>

        {/* Personalización de Interfaz */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Personalización de Interfaz</h2>
            <p className={styles.sectionDescription}>
              Ajusta la apariencia del sistema a tu gusto
            </p>
          </div>
          
          <div className={styles.dropdown}>
            <label className={styles.label}>Tema de Color</label>
            <div className={styles.selectWrapper}>
              <select 
                value={preferences?.theme || ''}
                onChange={(e) => {
                  if (!preferences) return;
                  persistPreferences({ ...preferences, theme: e.target.value });
                }}
                className={styles.select}
                disabled={!preferences || savingPreferences}
              >
                {themeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className={styles.selectIcon} size={15} />
            </div>
          </div>
        </section>

        <div className={styles.divider}></div>

        {/* Seguridad y Privacidad */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Seguridad y Privacidad</h2>
            <p className={styles.sectionDescription}>
              Protege tu cuenta y tus datos
            </p>
          </div>

          {/* Sesiones Activas */}
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Sesiones Activas</h3>
            <p className={styles.subsectionDescription}>
              Gestiona los dispositivos con acceso a tu cuenta
            </p>
          </div>

          <div className={styles.sessionsList}>
            {sessions.map((s) => {
              const isMobile = /android|ios|iphone/i.test(s.device);
              const Icon = isMobile ? Smartphone : Monitor;
              const when = s.current ? 'Ahora' : new Date(s.last_active).toLocaleString('es-ES');
              return (
                <div key={s.id} className={styles.sessionCard}>
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionDevice}>
                      <Icon size={20} className={styles.deviceIcon} />
                      <div>
                        <h4 className={styles.sessionTitle}>{s.device}</h4>
                        <p className={styles.sessionLocation}>{s.location} • {when}</p>
                      </div>
                    </div>
                  </div>
                  {s.current ? (
                    <div className={styles.sessionStatus}>
                      <span className={styles.onlineStatus}>En Línea</span>
                    </div>
                  ) : (
                    <button className={styles.closeSessionBtn} onClick={() => handleCloseSession(s.id)}>
                      Cerrar
                    </button>
                  )}
                </div>
              );
            })}
            {!loading && !sessions.length && (
              <div className={styles.sectionDescription}>No hay sesiones activas.</div>
            )}
          </div>

          {/* Cambiar Contraseña */}
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Cambiar Contraseña</h3>
            <p className={styles.subsectionDescription}>
              Actualiza tu contraseña regularmente
            </p>
          </div>

          <form
            className={styles.passwordForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdatePassword();
            }}
          >
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Contraseña actual <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Escribe aquí..."
                className={styles.input}
                autoComplete="current-password"
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Contraseña nueva <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Escribe aquí..."
                className={styles.input}
                autoComplete="new-password"
              />
            </div>
            <div className={styles.updatePasswordWrapper}>
              <button
                type="submit"
                className={styles.updatePasswordBtn}
                disabled={!passwordForm.currentPassword || !passwordForm.newPassword}
              >
                Actualizar Contraseña
              </button>
            </div>
          </form>
          {passwordStatus && <div className={styles.sectionDescription}>{passwordStatus}</div>}
        </section>
      </div>
    </div>
  );
};

export default Settings;
