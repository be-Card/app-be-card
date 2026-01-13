import React, { useEffect, useMemo, useState } from 'react';
import { X, Calendar, ChevronDown, UserPlus } from 'lucide-react';
import styles from './AddClientModal.module.scss';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: NewClientData) => Promise<void> | void;
}

interface NewClientData {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  phone: string;
  gender: string;
  birthDate: string;
  address: string;
}

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

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<NewClientData>({
    firstName: '',
    lastName: '',
    email: '',
    age: 0,
    phone: '',
    gender: '',
    birthDate: '',
    address: ''
  });

  const [birthDateDisplay, setBirthDateDisplay] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const computedAge = useMemo(() => calcAge(formData.birthDate), [formData.birthDate]);

  useEffect(() => {
    if (formData.birthDate && !birthDateDisplay) {
      const [yyyy, mm, dd] = formData.birthDate.split('-');
      if (yyyy && mm && dd) setBirthDateDisplay(`${dd}/${mm}/${yyyy}`);
    }
  }, [formData.birthDate, birthDateDisplay]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Los apellidos son requeridos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    const ageToValidate = formData.birthDate ? computedAge : formData.age;
    if (!ageToValidate || ageToValidate < 18) {
      newErrors.age = 'La edad debe ser mayor a 18 años';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El número de teléfono es requerido';
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
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({ ...formData, age: computedAge || formData.age });
      handleClose();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      age: 0,
      phone: '',
      gender: '',
      birthDate: '',
      address: ''
    });
    setBirthDateDisplay('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Agregar Nuevo Cliente</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.modalDivider} />
        
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
              onChange={handleInputChange}
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
                value={computedAge || formData.age || ''}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.age ? styles.inputError : ''}`}
                placeholder="Escribe aquí..."
                min="18"
                disabled={Boolean(formData.birthDate)}
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
                onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  name="birthDateDisplay"
                  value={birthDateDisplay}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBirthDateDisplay(v);
                    const iso = toIsoDate(v);
                    setFormData((prev) => ({ ...prev, birthDate: iso }));
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
              onChange={handleInputChange}
              className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
              placeholder="Escribe aquí..."
            />
            {errors.address && <span className={styles.errorText}>{errors.address}</span>}
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.modalDivider} />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              <UserPlus size={16} />
              {isLoading ? 'Agregando...' : 'Agregar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
