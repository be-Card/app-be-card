import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, ChevronDown } from 'lucide-react';
import clientService from '../services/clientService';
import { Client, EditClientFormData } from '../types';
import styles from './EditClient.module.css';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  age?: string;
  gender?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface EditClientFormState {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
}

const EditClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<EditClientFormState>({
    firstName: '',
    lastName: '',
    age: 0,
    gender: '',
    birthDate: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClientData = async () => {
      if (!id) {
        setError('ID de cliente no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const clientId = id;
        
        if (!clientId) {
          setError('ID de cliente no válido');
          setLoading(false);
          return;
        }
        
        const response = await clientService.getClientById(clientId);
        const clientData = clientService.convertDetailResponseToClient(response);
        setClient(clientData);

        const parts = (clientData.name || '').trim().split(' ').filter(Boolean);
        const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : (parts[0] || '');
        const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

        const toGenderCode = (g?: string | null): string => {
          const val = (g || '').toLowerCase();
          if (val.startsWith('m')) return 'M';
          if (val.startsWith('f')) return 'F';
          if (val.startsWith('o')) return 'O';
          return '';
        };

        setFormData({
          firstName,
          lastName,
          age: clientData.age || 0,
          gender: toGenderCode(clientData.gender),
          birthDate: clientData.birthDate || '',
          email: clientData.email || '',
          phone: clientData.phone || '',
          address: clientData.address || '',
        });
      } catch {
        setError('Error al cargar los datos del cliente');
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Los apellidos son requeridos';
    }

    if (!formData.age || formData.age < 18) {
      newErrors.age = 'La edad debe ser mayor a 18 años';
    }

    if (!formData.gender) {
      newErrors.gender = 'El género es requerido';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'La fecha de nacimiento es requerida';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!id) {
      setError('ID de cliente no válido');
      return;
    }
    
    const clientId = id;
    
    if (!clientId) {
      setError('ID de cliente no válido');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const genderNormalized = formData.gender === 'M' ? 'Masculino' : formData.gender === 'F' ? 'Femenino' : 'Otro';
      const updateData: EditClientFormData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gender: genderNormalized,
        birthDate: formData.birthDate,
      };

      await clientService.updateClient(clientId, updateData);
      
      // Redirigir a la lista de clientes
      navigate('/clients');
    } catch {
      setError('Error al actualizar el cliente. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <p>Cargando datos del cliente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Error: {error}</p>
          <button onClick={() => navigate('/clients')} className={styles.backButton}>
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Cliente no encontrado</p>
          <button onClick={() => navigate('/clients')} className={styles.backButton}>
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editClient}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={20} />
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Editar Cliente</h1>
            <p className={styles.subtitle}>
              Modificar información de {formData.firstName} {formData.lastName}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.clientProfile}>
          <div className={styles.avatar}>
            <span>{formData.firstName.charAt(0)}{formData.lastName.charAt(0)}</span>
          </div>
          <div className={styles.profileInfo}>
            <h2>{formData.firstName} {formData.lastName}</h2>
            <div className={styles.badges}>
              <span className={styles.statusBadge}>{client.loyaltyLevel}</span>
              <span className={styles.activeBadge}>{client.status}</span>
            </div>
            <p className={styles.memberSince}>Cliente desde {client.joinDate}</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>${client.totalSpent?.toLocaleString() || '0'}</span>
              <span className={styles.statLabel}>Gasto Total</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{client.totalOrders || 0}</span>
              <span className={styles.statLabel}>Órdenes</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>${client.totalOrders ? Math.round((client.totalSpent || 0) / client.totalOrders) : 0}</span>
              <span className={styles.statLabel}>Promedio/Orden</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{client.loyaltyPoints || 0}</span>
              <span className={styles.statLabel}>Puntos</span>
            </div>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Información Personal</h3>
            
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
                  placeholder="Escribe aquí"
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
                  placeholder="Escribe aquí"
                />
                {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Edad <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.age ? styles.inputError : ''}`}
                  placeholder="Escribe aquí"
                  min="18"
                />
                {errors.age && <span className={styles.errorText}>{errors.age}</span>}
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Género <span className={styles.required}>*</span>
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleInputChange}
                    className={`${styles.select} ${errors.gender ? styles.inputError : ''}`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                  <ChevronDown className={styles.selectIcon} size={16} />
                </div>
                {errors.gender && <span className={styles.errorText}>{errors.gender}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Fecha de Nacimiento <span className={styles.required}>*</span>
              </label>
              <div className={styles.dateWrapper}>
                <Calendar className={styles.dateIcon} size={16} />
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={`${styles.input} ${styles.dateInput} ${errors.birthDate ? styles.inputError : ''}`}
                />
              </div>
              {errors.birthDate && <span className={styles.errorText}>{errors.birthDate}</span>}
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
                placeholder="Escribe aquí"
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Teléfono <span className={styles.required}>*</span>
              </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                  placeholder="Escribe aquí"
                />
              {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
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
                  placeholder="Escribe aquí"
                />
              {errors.address && <span className={styles.errorText}>{errors.address}</span>}
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isLoading}
            >
              <Save size={16} />
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClient;
