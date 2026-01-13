import React, { useEffect, useMemo, useState } from 'react';
import { X, Calendar, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Client } from '../types';
import styles from './EditClientModal.module.scss';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (data: EditModalFormData) => void;
}

type EditModalFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  birthDate: string;
};

const toIsoDate = (display?: string) => {
  if (!display) return '';
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!m) return '';
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900 || yyyy > 2100) return '';
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (dt.getUTCFullYear() !== yyyy || dt.getUTCMonth() !== mm - 1 || dt.getUTCDate() !== dd) return '';
  return `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
};

const toDisplayDate = (iso?: string | null) => {
  if (!iso) return '';
  const [yyyy, mm, dd] = String(iso).split('-');
  if (!yyyy || !mm || !dd) return '';
  return `${dd}/${mm}/${yyyy}`;
};

const calcAge = (iso?: string) => {
  if (!iso) return 0;
  const [yyyy, mm, dd] = iso.split('-').map((v) => Number(v));
  if (!yyyy || !mm || !dd) return 0;
  const today = new Date();
  let age = today.getFullYear() - yyyy;
  const mDiff = today.getMonth() + 1 - mm;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < dd)) age -= 1;
  return Math.max(0, age);
};

const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onSave
}) => {
  const [formData, setFormData] = useState<EditModalFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    birthDate: ''
  });

  const [birthDateDisplay, setBirthDateDisplay] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (client && isOpen) {
      const full = (client.name || '').trim();
      const parts = full.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      setFormData({
        firstName,
        lastName,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        gender: client.gender || '',
        birthDate: client.birthDate || ''
      });
      setBirthDateDisplay(toDisplayDate(client.birthDate));
      setErrors({});
    }
  }, [client, isOpen]);

  const computedAge = useMemo(() => calcAge(formData.birthDate), [formData.birthDate]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Los apellidos son requeridos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!computedAge || computedAge < 18 || computedAge > 120) {
      newErrors.age = 'La edad debe estar entre 18 y 120 años';
    }

    if (!formData.gender) {
      newErrors.gender = 'El género es requerido';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'La fecha de nacimiento es requerida';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setIsLoading(true);
        onSave(formData);
        onClose();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field: keyof EditModalFormData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }));

    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar Cliente {client?.name || ''}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nombre <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                placeholder="Escribe aquí..."
              />
              {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Apellidos <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                placeholder="Escribe aquí..."
              />
              {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Correo Electrónico <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="Escribe aquí..."
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Edad <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                name="age"
                value={computedAge || ''}
                className={`${styles.input} ${errors.age ? styles.inputError : ''}`}
                placeholder="Escribe aquí..."
                disabled
              />
              {errors.age && <span className={styles.errorText}>{errors.age}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Número de teléfono <span className={styles.required}>*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                placeholder="Escribe aquí..."
              />
              {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Género <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={`${styles.select} ${errors.gender ? styles.inputError : ''}`}
                >
                  <option value="">Seleccione una opción</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
                <ChevronDown className={styles.selectIcon} size={16} />
              </div>
              {errors.gender && <span className={styles.errorText}>{errors.gender}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Fecha de Nacimiento <span className={styles.required}>*</span>
              </label>
              <div className={styles.dateWrapper}>
                <Calendar className={styles.dateIcon} size={16} />
                <input
                  type="text"
                  inputMode="numeric"
                  value={birthDateDisplay}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBirthDateDisplay(v);
                    const iso = toIsoDate(v);
                    handleInputChange('birthDate', iso);
                    if (errors.birthDate) {
                      setErrors((prev) => ({ ...prev, birthDate: '' }));
                    }
                  }}
                  className={`${styles.input} ${styles.dateInput} ${errors.birthDate ? styles.inputError : ''}`}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              {errors.birthDate && <span className={styles.errorText}>{errors.birthDate}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Dirección <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
              placeholder="Escribe aquí..."
            />
            {errors.address && <span className={styles.errorText}>{errors.address}</span>}
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.modalDivider} />
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              <CheckCircle2 size={16} />
              Guardar Datos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClientModal;
