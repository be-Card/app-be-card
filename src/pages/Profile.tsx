import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit } from 'lucide-react';
import profileService, { ProfileMeResponse } from '../services/profileService';
import styles from './Profile.module.scss';

const Profile: React.FC = () => {
  const [user, setUser] = useState<ProfileMeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const me = await profileService.getMe();
        setUser(me);
      } catch {
        setError('Error al cargar los datos del usuario');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>{error || 'No se pudieron cargar los datos del usuario'}</p>
        </div>
      </div>
    );
  }

  // Generar iniciales para el avatar
  const getInitials = (nombres: string, apellidos: string) => {
    return `${(nombres || '').charAt(0)}${(apellidos || '').charAt(0)}`.toUpperCase();
  };

  const getActivityPercentage = (activity: string) => {
    switch (activity) {
      case 'Alto': return 90;
      case 'Medio': return 60;
      case 'Bajo': return 30;
      default: return 0;
    }
  };

  const getSessionsPercentage = (sessions: number) => {
    return Math.min((sessions / 300) * 100, 100);
  };

  const getReportsPercentage = (reports: number) => {
    return Math.min((reports / 100) * 100, 100);
  };

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const roleLabel = user.roles?.length ? user.roles.join(', ') : 'Sin rol';

  return (
    <div className={styles.profileContainer}>
      {/* Header Section */}
      <div className={styles.profileHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Mi Perfil</h1>
          <p className={styles.subtitle}>Gestiona tu información personal y preferencias</p>
        </div>
        <Link to="edit" className={styles.editButton}>
          <Edit size={20} />
          <span>Editar</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className={styles.profileContent}>
        {/* Left Column - Profile Card & Stats */}
        <div className={styles.leftColumn}>
          {/* Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className={styles.avatarImage} />
                ) : (
                  <span className={styles.initials}>
                    {getInitials(user.nombres, user.apellidos)}
                  </span>
                )}
              </div>
            </div>
            
            <div className={styles.userInfo}>
              <h2 className={styles.userName}>
                {user.nombres} {user.apellidos}
              </h2>
              <p className={styles.userEmail}>{user.email || '—'}</p>
              <div className={styles.roleBadge}>
                <span>{roleLabel}</span>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.memberInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Miembro desde</span>
                <span className={styles.value}>{formatMemberSince(user.fecha_creacion)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Rol</span>
                <span className={styles.value}>{user.roles?.[0] || 'Sin rol'}</span>
              </div>
            </div>
          </div>

          {/* Statistics Card */}
          <div className={styles.statsCard}>
            <h3 className={styles.statsTitle}>Estadísticas</h3>
            
            <div className={styles.statItem}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Sesiones</span>
                <span className={styles.statValue}>{user.stats.sessions}</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${getSessionsPercentage(user.stats.sessions)}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Actividad</span>
                <span className={styles.statValue}>{user.stats.activity}</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${styles.activityProgress}`}
                  style={{ width: `${getActivityPercentage(user.stats.activity)}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Reportes</span>
                <span className={styles.statValue}>{user.stats.reports}</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${getReportsPercentage(user.stats.reports)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Information Forms */}
        <div className={styles.rightColumn}>
          {/* Personal Information */}
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Información Personal</h3>
            
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Nombre <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputField}>
                  <span>{user.nombres}</span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Apellidos <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputField}>
                  <span>{user.apellidos}</span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Teléfono <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputField}>
                  <span>{user.telefono || '—'}</span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Correo Electrónico <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputField}>
                  <span>{user.email || '—'}</span>
                </div>
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.inputLabel}>
                  Dirección <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputField}>
                  <span>{user.direccion || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
