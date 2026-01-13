import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import profileService, { ProfileMeResponse, ProfileMeUpdateRequest } from '../services/profileService';
import styles from './EditProfile.module.scss';

interface EditProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  startDate: string;
  employeeId: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  position?: string;
  department?: string;
  startDate?: string;
  employeeId?: string;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user: storeUser, setUser } = useStore();
  const [profile, setProfile] = useState<ProfileMeResponse | null>(null);
  const [formData, setFormData] = useState<EditProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
    startDate: '',
    employeeId: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const me = await profileService.getMe();
        setProfile(me);

        setFormData({
          firstName: me.nombres || '',
          lastName: me.apellidos || '',
          email: me.email || '',
          phone: me.telefono || '',
          address: me.direccion || '',
          position: me.professional?.puesto || '',
          department: me.professional?.departamento || '',
          startDate: me.professional?.fecha_ingreso || '',
          employeeId: me.professional?.id_empleado || '',
        });
      } catch {
        setMessage({ type: 'error', text: 'Error al cargar los datos del usuario' });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatMemberSince = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Los apellidos son requeridos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del correo electrónico no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'El puesto es requerido';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'El departamento es requerido';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de ingreso es requerida';
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'El ID de empleado es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EditProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Clear message when user makes changes
    if (message) {
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !profile) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const updateData: ProfileMeUpdateRequest = {
        nombres: formData.firstName.trim(),
        apellidos: formData.lastName.trim(),
        telefono: formData.phone.trim() || null,
        direccion: formData.address.trim() || null,
        puesto: formData.position.trim() || null,
        departamento: formData.department.trim() || null,
        fecha_ingreso: formData.startDate || null,
        id_empleado: formData.employeeId.trim() || null,
      };

      const updated = await profileService.updateMe(updateData);
      
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });

      if (storeUser) {
        setUser({
          ...storeUser,
          nombres: updated.nombres,
          apellidos: updated.apellidos,
          telefono: updated.telefono || undefined,
        });
      }
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.editProfileContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.editProfileContainer}>
        <div className={styles.errorContainer}>
          <AlertCircle size={48} />
          <p>Error al cargar los datos del usuario</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editProfileContainer}>
      {/* Header Section */}
      <div className={styles.profileHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Mi Perfil</h1>
          <p className={styles.subtitle}>Gestiona tu información personal y preferencias</p>
        </div>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/profile')}
          type="button"
        >
          <ArrowLeft size={20} />
          <span>Volver al Perfil</span>
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`${styles.messageContainer} ${styles[message.type]}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Content */}
      <div className={styles.profileContent}>
        {/* Left Column - Profile Card & Stats */}
        <div className={styles.leftColumn}>
          {/* Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                <span className={styles.initials}>
                  {getInitials(formData.firstName, formData.lastName)}
                </span>
              </div>
            </div>
            
            <div className={styles.userInfo}>
              <h2 className={styles.userName}>
                {formData.firstName} {formData.lastName}
              </h2>
              <p className={styles.userEmail}>{formData.email}</p>
              <div className={styles.roleBadge}>
                <span>{profile.roles?.[0] || 'Sin rol'}</span>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.memberInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Miembro desde</span>
                <span className={styles.value}>{formatMemberSince(profile.fecha_creacion)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Rol</span>
                <span className={styles.value}>{profile.roles?.[0] || 'Sin rol'}</span>
              </div>
            </div>
          </div>

          {/* Statistics Card */}
          <div className={styles.statsCard}>
            <h3 className={styles.statsTitle}>Estadísticas</h3>
            
            <div className={styles.statItem}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Sesiones</span>
                <span className={styles.statValue}>{profile.stats.sessions}</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${styles.sessionsProgress}`}
                  style={{ width: `${Math.min((profile.stats.sessions / 300) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Actividad</span>
                <span className={styles.statValue}>{profile.stats.activity}</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${styles.activityProgress}`}
                  style={{
                    width: `${profile.stats.activity === 'Alto' ? 90 : profile.stats.activity === 'Medio' ? 60 : 30}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Reportes</span>
                <span className={styles.statValue}>{profile.stats.reports}</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${styles.reportsProgress}`}
                  style={{ width: `${Math.min((profile.stats.reports / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className={styles.rightColumn}>
          <form onSubmit={handleSubmit} className={styles.editForm}>
            {/* Personal Information */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Información Personal</h3>
              
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelText}>Nombre </span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? styles.error : ''}
                      placeholder="Maria"
                      autoComplete="given-name"
                    />
                  </div>
                  {errors.firstName && <span className={styles.errorMessage}>{errors.firstName}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelText}>Apellidos </span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? styles.error : ''}
                      placeholder="Salazar"
                      autoComplete="family-name"
                    />
                  </div>
                  {errors.lastName && <span className={styles.errorMessage}>{errors.lastName}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelText}>Teléfono </span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={errors.phone ? styles.error : ''}
                      placeholder="+51 123456789"
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelText}>Correo Electrónico </span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={errors.email ? styles.error : ''}
                      placeholder="admin@becard.com"
                      autoComplete="email"
                      disabled
                    />
                  </div>
                  {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelText}>Dirección </span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={errors.address ? styles.error : ''}
                      placeholder="Av. Corrientes 1234, CABA"
                      autoComplete="street-address"
                    />
                  </div>
                  {errors.address && <span className={styles.errorMessage}>{errors.address}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelText}>Puesto </span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className={errors.position ? styles.error : ''}
                      placeholder="Gerente General"
                    />
                  </div>
                  {errors.position && <span className={styles.errorMessage}>{errors.position}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelText}>Departamento </span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={errors.department ? styles.error : ''}
                      placeholder="Administración"
                    />
                  </div>
                  {errors.department && <span className={styles.errorMessage}>{errors.department}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelText}>Fecha de Ingreso </span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className={errors.startDate ? styles.error : ''}
                    />
                  </div>
                  {errors.startDate && <span className={styles.errorMessage}>{errors.startDate}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelText}>ID de Empleado </span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={(e) => handleInputChange('employeeId', e.target.value)}
                      className={errors.employeeId ? styles.error : ''}
                      placeholder="EMP-001"
                    />
                  </div>
                  {errors.employeeId && <span className={styles.errorMessage}>{errors.employeeId}</span>}
                </div>
              </div>
            </div>

            {/* Save Button Container */}
            <div className={styles.buttonContainer}>
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={isSubmitting}
              >
                <Save size={20} />
                <span>{isSubmitting ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
