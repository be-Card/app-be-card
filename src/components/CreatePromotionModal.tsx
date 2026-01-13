import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import styles from './CreatePromotionModal.module.scss';
import { CervezaAPI } from '../services/cervezas';

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (promotionData: PromotionFormData) => void;
}

export interface PromotionFormData {
  name: string;
  discount: string;
  scope: string;
  days: string[];
  startTime: string;
  endTime: string;
}

const CreatePromotionModal: React.FC<CreatePromotionModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    discount: '',
    scope: '',
    days: [],
    startTime: '',
    endTime: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [scopeOptions, setScopeOptions] = useState<string[]>(['Todas las cervezas']);
  const [loadingStyles, setLoadingStyles] = useState(false);
  const [stylesError, setStylesError] = useState<string | null>(null);

  const quickDiscounts = [10, 15, 20, 25];

  // Cargar estilos de cerveza dinámicamente
  useEffect(() => {
    const loadBeerStyles = async () => {
      try {
        setLoadingStyles(true);
        setStylesError(null);
        const data = await CervezaAPI.getEstilosCerveza();
        // Agregar "Todas las cervezas" al inicio y luego los estilos obtenidos
        const estilos = data
          .map((e: any) => e.estilo)
          .filter((v: any) => typeof v === 'string' && v.trim().length > 0);
        setScopeOptions(['Todas las cervezas', ...Array.from(new Set(estilos))]);
      } catch {
        setStylesError('No se pudieron cargar los estilos');
        setScopeOptions(['Todas las cervezas']);
      } finally {
        setLoadingStyles(false);
      }
    };

    if (isOpen) {
      loadBeerStyles();
    }
  }, [isOpen]);

  const daysOfWeek = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  const handleInputChange = (field: keyof PromotionFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleQuickDiscount = (discount: number) => {
    setFormData(prev => ({
      ...prev,
      discount: discount.toString()
    }));
    
    if (formErrors.discount) {
      setFormErrors(prev => ({
        ...prev,
        discount: ''
      }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
    
    if (formErrors.days) {
      setFormErrors(prev => ({
        ...prev,
        days: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre de la regla es requerido';
    }

    if (!formData.discount.trim()) {
      errors.discount = 'El descuento es requerido';
    } else if (isNaN(Number(formData.discount)) || Number(formData.discount) <= 0 || Number(formData.discount) > 100) {
      errors.discount = 'El descuento debe ser un número entre 1 y 100';
    }

    if (!formData.scope) {
      errors.scope = 'El alcance es requerido';
    }

    if (formData.days.length === 0) {
      errors.days = 'Debe seleccionar al menos un día';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      discount: '',
      scope: '',
      days: [],
      startTime: '',
      endTime: ''
    });
    setFormErrors({});
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose} onKeyDown={handleKeyDown}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Crear Nueva Promoción</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Nombre de la Regla */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Nombre de la Regla <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={`${styles.fieldInput} ${formErrors.name ? styles.error : ''}`}
              placeholder="Ej: Jueves de IPAs"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            {formErrors.name && <span className={styles.errorMessage}>{formErrors.name}</span>}
          </div>

          {/* Descuento */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Descuento (%) <span className={styles.required}>*</span>
            </label>
            <div className={styles.discountContainer}>
              <input
                type="number"
                className={`${styles.fieldInput} ${styles.discountInput} ${formErrors.discount ? styles.error : ''}`}
                placeholder="0"
                min="1"
                max="100"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', e.target.value)}
              />
              <div className={styles.quickDiscounts}>
                {quickDiscounts.map(discount => (
                  <button
                    key={discount}
                    type="button"
                    className={`${styles.quickDiscountBtn} ${formData.discount === discount.toString() ? styles.active : ''}`}
                    onClick={() => handleQuickDiscount(discount)}
                  >
                    {discount}%
                  </button>
                ))}
              </div>
            </div>
            {formErrors.discount && <span className={styles.errorMessage}>{formErrors.discount}</span>}
          </div>

          {/* Alcance */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Alcance <span className={styles.required}>*</span>
            </label>
            <select
              className={`${styles.fieldSelect} ${formErrors.scope ? styles.error : ''}`}
              value={formData.scope}
              onChange={(e) => handleInputChange('scope', e.target.value)}
              disabled={loadingStyles}
            >
              <option value="">
                {loadingStyles ? 'Cargando estilos...' : stylesError ? stylesError : 'Seleccionar alcance'}
              </option>
              {scopeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {formErrors.scope && <span className={styles.errorMessage}>{formErrors.scope}</span>}
          </div>

          {/* Días de la Semana */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Días de la Semana <span className={styles.required}>*</span>
            </label>
            <div className={styles.daysContainer}>
              {daysOfWeek.map(day => (
                <label key={day.key} className={styles.dayCheckbox}>
                  <input
                    type="checkbox"
                    checked={formData.days.includes(day.key)}
                    onChange={() => handleDayToggle(day.key)}
                  />
                  <span className={styles.checkboxCustom}></span>
                  <span className={styles.dayLabel}>{day.label}</span>
                </label>
              ))}
            </div>
            {formErrors.days && <span className={styles.errorMessage}>{formErrors.days}</span>}
          </div>

          {/* Horarios */}
          <div className={styles.timeContainer}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Hora Inicio</label>
              <div className={styles.timeInputContainer}>
                <Clock className={styles.timeIcon} size={20} />
                <input
                  type="time"
                  className={styles.timeInput}
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Hora Fin</label>
              <div className={styles.timeInputContainer}>
                <Clock className={styles.timeIcon} size={20} />
                <input
                  type="time"
                  className={styles.timeInput}
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className={styles.modalActions}>
            <button type="submit" className={styles.submitButton}>
              Agregar Promoción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePromotionModal;
