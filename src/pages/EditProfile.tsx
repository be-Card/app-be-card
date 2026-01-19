import React, { useState, useEffect, useRef } from 'react';
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
  avatar: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('READ_ERROR'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_ERROR'));
    img.src = src;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('BLOB_ERROR'));
        else resolve(blob);
      },
      type,
      quality
    );
  });

const compressImageToDataURL = async (
  file: File,
  opts: { maxBytes: number; maxDimension: number; mime: string }
): Promise<string> => {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    const scale = Math.min(1, opts.maxDimension / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    let quality = 0.9;
    let attempt = 0;
    let currentWidth = width;
    let currentHeight = height;

    while (attempt < 14) {
      const canvas = document.createElement('canvas');
      canvas.width = currentWidth;
      canvas.height = currentHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('CANVAS_ERROR');

      ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

      const blob = await canvasToBlob(canvas, opts.mime, quality);
      if (blob.size <= opts.maxBytes) {
        return await readFileAsDataURL(new File([blob], file.name, { type: opts.mime }));
      }

      if (quality > 0.55) {
        quality = Math.max(0.55, quality - 0.08);
      } else {
        currentWidth = Math.max(1, Math.round(currentWidth * 0.88));
        currentHeight = Math.max(1, Math.round(currentHeight * 0.88));
      }

      attempt += 1;
    }

    throw new Error('TOO_LARGE');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user: storeUser, setUser } = useStore();
  const [profile, setProfile] = useState<ProfileMeResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<EditProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvatarProcessing, setIsAvatarProcessing] = useState(false);
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
          avatar: me.avatar || '',
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
        avatar: formData.avatar ? formData.avatar : null,
        puesto: profile.professional?.puesto ?? null,
        departamento: profile.professional?.departamento ?? null,
        fecha_ingreso: profile.professional?.fecha_ingreso ?? null,
        id_empleado: profile.professional?.id_empleado ?? null,
      };

      const updated = await profileService.updateMe(updateData);
      
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });

      if (storeUser) {
        setUser({
          ...storeUser,
          nombres: updated.nombres,
          apellidos: updated.apellidos,
          telefono: updated.telefono || undefined,
          avatar: (updated as any).avatar ?? storeUser.avatar,
        });
      }
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        navigate('..');
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
          onClick={() => navigate('..')}
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
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className={styles.avatarImage} />
                ) : (
                  <span className={styles.initials}>
                    {getInitials(formData.firstName, formData.lastName)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.changeAvatarButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || isAvatarProcessing}
              >
                {isAvatarProcessing ? 'Procesando…' : 'Cambiar foto'}
              </button>
              {formData.avatar && (
                <button
                  type="button"
                  className={styles.removeAvatarButton}
                  onClick={() => setFormData((p) => ({ ...p, avatar: '' }))}
                  disabled={isSubmitting || isAvatarProcessing}
                >
                  Quitar foto
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  e.currentTarget.value = '';

                  if (!file.type.startsWith('image/')) {
                    setMessage({ type: 'error', text: 'Formato de imagen inválido.' });
                    return;
                  }

                  if (file.size > 10_000_000) {
                    setMessage({ type: 'error', text: 'La imagen es demasiado grande (máx. 10MB).' });
                    return;
                  }

                  try {
                    setIsAvatarProcessing(true);
                    setMessage(null);

                    const dataUrl =
                      file.size <= 380_000
                        ? await readFileAsDataURL(file)
                        : await compressImageToDataURL(file, {
                            maxBytes: 380_000,
                            maxDimension: 512,
                            mime: 'image/jpeg',
                          });

                    setFormData((p) => ({ ...p, avatar: dataUrl }));
                  } catch {
                    setMessage({ type: 'error', text: 'No se pudo procesar la imagen. Probá con otra.' });
                  } finally {
                    setIsAvatarProcessing(false);
                  }
                }}
                style={{ display: 'none' }}
              />
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
